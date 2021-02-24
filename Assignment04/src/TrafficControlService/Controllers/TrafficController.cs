using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrafficControlService.Events;
using TrafficControlService.Helpers;
using TrafficControlService.Models;
using Dapr.Client;

namespace TrafficControlService.Controllers
{
    [ApiController]
    [Route("trafficcontrol")]
    public class TrafficController : ControllerBase
    {
        private const string DAPR_STORE_NAME = "statestore";
        private readonly ILogger<TrafficController> _logger;
        private readonly ISpeedingViolationCalculator _speedingViolationCalculator;
        private readonly string _roadId;
        private readonly JsonSerializerOptions _jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public TrafficController(
            ILogger<TrafficController> logger,
            ISpeedingViolationCalculator speedingViolationCalculator)
        {
            _logger = logger;
            _speedingViolationCalculator = speedingViolationCalculator;
            _roadId = speedingViolationCalculator.GetRoadId();
        }

        [HttpPost("entrycam")]
        public async Task<ActionResult> VehicleEntry(VehicleRegistered msg, [FromServices] DaprClient daprClient)
        {
            // get vehicle details
            var vehicleInfo = await daprClient.InvokeMethodAsync<VehicleInfo>(
               "governmentservice",
               $"rdw/vehicle/{msg.LicenseNumber}",
               new HttpInvocationOptions { Method = HttpMethod.Get });

            // log entry
            _logger.LogInformation($"ENTRY detected in lane {msg.Lane} at {msg.Timestamp.ToString("hh:mm:ss")}: " +
                $"{vehicleInfo.Brand} {vehicleInfo.Model} with license-number {msg.LicenseNumber}.");

            // store vehicle state
            var vehicleState = new VehicleState
            {
                LicenseNumber = msg.LicenseNumber,
                Brand = vehicleInfo.Brand,
                Model = vehicleInfo.Model,
                EntryTimestamp = msg.Timestamp
            };

            await daprClient.SaveStateAsync<VehicleState>(DAPR_STORE_NAME, msg.LicenseNumber, vehicleState);

            return Ok();
        }

        [HttpPost("exitcam")]
        public async Task<ActionResult> VehicleExit(VehicleRegistered msg, [FromServices] IHttpClientFactory httpClientFactory, [FromServices] DaprClient daprClient)
        {
            // get vehicle state
            var state = await daprClient.GetStateEntryAsync<VehicleState>(DAPR_STORE_NAME, msg.LicenseNumber);
            if (state.Value == null)
            {
                return NotFound();
            }

            // log exit
            _logger.LogInformation($"EXIT detected in lane {msg.Lane} at {msg.Timestamp.ToString("hh:mm:ss")}: " +
                $"{state.Value.Brand} {state.Value.Model} with license-number {state.Value.LicenseNumber}.");

            // update state
            state.Value.ExitTimestamp = msg.Timestamp;
            await state.SaveAsync();

            // handle possible speeding violation
            int violation = _speedingViolationCalculator.DetermineSpeedingViolationInKmh(state.Value.EntryTimestamp, state.Value.ExitTimestamp);
            if (violation > 0)
            {
                _logger.LogInformation($"Speeding violation detected ({violation} KMh) of {state.Value.Brand} {state.Value.Model} " +
                    $"with license-number {state.Value.LicenseNumber}.");

                var @event = new SpeedingViolationDetected
                {
                    VehicleId = msg.LicenseNumber,
                    RoadId = _roadId,
                    ViolationInKmh = violation,
                    Timestamp = msg.Timestamp
                };

                var @eventJson = new StringContent(JsonSerializer.Serialize(@event, _jsonSerializerOptions), Encoding.UTF8, "application/json");
                var httpClient = httpClientFactory.CreateClient();
                var response = await httpClient.PostAsync("http://localhost:6000/cjib/speedingviolation", @eventJson);
            }

            return Ok();
        }
    }
}

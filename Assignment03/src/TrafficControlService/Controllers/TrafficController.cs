using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrafficControlService.Events;
using TrafficControlService.Helpers;
using TrafficControlService.Models;
using TrafficControlService.Repositories;
using Dapr.Client;

namespace TrafficControlService.Controllers
{
    [ApiController]
    [Route("trafficcontrol")]
    public class TrafficController : ControllerBase
    {
        private readonly ILogger<TrafficController> _logger;
        private readonly IVehicleStateRepository _repo;
        private readonly ISpeedingViolationCalculator _speedingViolationCalculator;
        private readonly string _roadId;
        private readonly JsonSerializerOptions _jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public TrafficController(
            ILogger<TrafficController> logger,
            IVehicleStateRepository repository,
            ISpeedingViolationCalculator speedingViolationCalculator)
        {
            _logger = logger;
            _repo = repository;
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

            _repo.StoreVehicleState(vehicleState);

            return Ok();
        }

        [HttpPost("exitcam")]
        public async Task<ActionResult> VehicleExit(VehicleRegistered msg, [FromServices] IHttpClientFactory httpClientFactory)
        {
            // get vehicle state
            var state = _repo.GetVehicleState(msg.LicenseNumber);
            if (state == null)
            {
                return NotFound();
            }

            // log exit
            _logger.LogInformation($"EXIT detected in lane {msg.Lane} at {msg.Timestamp.ToString("hh:mm:ss")}: " +
                $"{state.Brand} {state.Model} with license-number {state.LicenseNumber}.");

            // update state
            state.ExitTimestamp = msg.Timestamp;
            _repo.StoreVehicleState(state);

            // handle possible speeding violation
            int violation = _speedingViolationCalculator.DetermineSpeedingViolationInKmh(state.EntryTimestamp, state.ExitTimestamp);
            if (violation > 0)
            {
                _logger.LogInformation($"Speeding violation detected ({violation} KMh) of {state.Brand} {state.Model} " +
                    $"with license-number {state.LicenseNumber}.");

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

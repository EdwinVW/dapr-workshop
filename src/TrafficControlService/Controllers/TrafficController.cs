using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrafficControlService.Events;
using TrafficControlService.DomainServices;
using TrafficControlService.Models;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;

namespace TrafficControlService.Controllers
{
    [ApiController]
    [Route("")]
    public class TrafficController : ControllerBase
    {
        private static readonly HttpClient _httpClient = new HttpClient();
        private static Dictionary<string, VehicleState> _state = new Dictionary<string, VehicleState>();
        private readonly ILogger<TrafficController> _logger;
        private readonly ISpeedingViolationCalculator _speedingViolationCalculator;
        private readonly string _roadId;

        public TrafficController(
            ILogger<TrafficController> logger, 
            ISpeedingViolationCalculator speedingViolationCalculator)
        {
            _logger = logger;
            _speedingViolationCalculator = speedingViolationCalculator;
            _roadId = speedingViolationCalculator.GetRoadId();
        }

        [HttpPost("entrycam")]
        public ActionResult VehicleEntry(VehicleRegistered msg)
        {
            try
            {
                // log entry
                _logger.LogInformation($"ENTRY detected in lane {msg.Lane} at {msg.Timestamp.ToString("hh:mm:ss")} " +
                    $"of vehicle with license-number {msg.LicenseNumber}.");

                // store vehicle state
                var vehicleState = new VehicleState
                {
                    LicenseNumber = msg.LicenseNumber,
                    EntryTimestamp = msg.Timestamp
                };
                if (_state.ContainsKey(msg.LicenseNumber))
                {
                    _state[msg.LicenseNumber] = vehicleState;
                }
                else
                {
                    _state.Add(msg.LicenseNumber, vehicleState);
                }

                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost("exitcam")]
        public async Task<ActionResult> VehicleExit(VehicleRegistered msg)
        {
            try
            {
                // get vehicle state
                if (!_state.ContainsKey(msg.LicenseNumber))
                {
                    return NotFound();
                }

                var vehicleState = _state[msg.LicenseNumber];

                // log exit
                _logger.LogInformation($"EXIT detected in lane {msg.Lane} at {msg.Timestamp.ToString("hh:mm:ss")} " +
                    $"of vehicle with license-number {msg.LicenseNumber}.");

                // update state
                vehicleState.ExitTimestamp = msg.Timestamp;
                _state[msg.LicenseNumber] = vehicleState;

                // handle possible speeding violation
                int violation = _speedingViolationCalculator.DetermineSpeedingViolationInKmh(
                    vehicleState.EntryTimestamp, vehicleState.ExitTimestamp);
                if (violation > 0)
                {
                    _logger.LogInformation($"Speeding violation detected ({violation} KMh) of vehicle" +
                        $"with license-number {vehicleState.LicenseNumber}.");

                    var speedingViolation = new SpeedingViolation
                    {
                        VehicleId = msg.LicenseNumber,
                        RoadId = _roadId,
                        ViolationInKmh = violation,
                        Timestamp = msg.Timestamp
                    };

                    // publish speedingviolation
                    var message = JsonContent.Create<SpeedingViolation>(speedingViolation);
                    await _httpClient.PostAsync("http://localhost:5001/collectfine", message);
                }

                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}

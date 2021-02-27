using System.Collections.Generic;
using System.Threading.Tasks;
using TrafficControlService.Models;

namespace TrafficControlService.Repositories
{
    public class InMemoryVehicleStateRepository : IVehicleStateRepository
    {
        private readonly Dictionary<string, VehicleState> _state;

        public InMemoryVehicleStateRepository()
        {
            _state = new Dictionary<string, VehicleState>();
        }
        public Task<VehicleState> GetVehicleStateAsync(string licenseNumber)
        {
            if (!_state.ContainsKey(licenseNumber))
            {
                return null;
            }
            return Task.FromResult(_state[licenseNumber]);
        }

        public Task SaveVehicleStateAsync(VehicleState vehicleState)
        {
            if (_state.ContainsKey(vehicleState.LicenseNumber))
            {
                _state[vehicleState.LicenseNumber] = vehicleState;
            }
            else
            {
                _state.Add(vehicleState.LicenseNumber, vehicleState);
            }

            return Task.CompletedTask;
        }
    }
}
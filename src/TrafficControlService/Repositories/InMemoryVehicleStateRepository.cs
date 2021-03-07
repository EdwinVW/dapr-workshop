using System.Collections.Concurrent;
using System.Threading.Tasks;
using TrafficControlService.Models;

namespace TrafficControlService.Repositories
{
    public class InMemoryVehicleStateRepository : IVehicleStateRepository
    {
        private readonly ConcurrentDictionary<string, VehicleState> _state;

        public InMemoryVehicleStateRepository()
        {
            _state = new ConcurrentDictionary<string, VehicleState>();
        }
        public Task<VehicleState> GetVehicleStateAsync(string licenseNumber)
        {
            VehicleState result = null;
            if (_state.TryGetValue(licenseNumber, out VehicleState state))
            {
                result = state;
            }
            return Task.FromResult(result);
        }

        public Task SaveVehicleStateAsync(VehicleState vehicleState)
        {
            _state.AddOrUpdate(vehicleState.LicenseNumber,
                newKey => vehicleState, (currentKey, currentState) => vehicleState);

            return Task.CompletedTask;
        }
    }
}
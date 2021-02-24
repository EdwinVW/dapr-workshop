using System.Collections.Generic;
using TrafficControlService.Models;

namespace TrafficControlService.Repositories
{
    public class InMemoryVehicleStateRepository : IVehicleStateRepository
    {
        private readonly object _lock = new object();
        private Dictionary<string, VehicleState> _data = new Dictionary<string, VehicleState>();

        public VehicleState GetVehicleState(string licenseNumber)
        {
            if (_data.ContainsKey(licenseNumber))
            {
                return _data[licenseNumber];
            }
            return null;
        }

        public void StoreVehicleState(VehicleState state)
        {
            lock (_lock)
            {
                if (_data.ContainsKey(state.LicenseNumber))
                {
                    _data[state.LicenseNumber] = state;
                }
                else
                {
                    _data.Add(state.LicenseNumber, state);
                }
            }
        }
    }
}
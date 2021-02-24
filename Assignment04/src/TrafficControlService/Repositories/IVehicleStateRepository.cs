using TrafficControlService.Models;

namespace TrafficControlService.Repositories
{
    public interface IVehicleStateRepository
    {
        void StoreVehicleState(VehicleState info);
        VehicleState GetVehicleState(string licenseNumber);
    }
}
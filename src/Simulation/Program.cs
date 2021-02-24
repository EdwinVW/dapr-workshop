using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Simulation.Proxies;

namespace Simulation
{
    class Program
    {
        static void Main(string[] args)
        {
            var httpClient = new HttpClient();
            int lanes = 3;
            CameraSimulation[] cameras = new CameraSimulation[lanes];
            for (var i = 0; i < lanes; i++)
            {
                var trafficControlService = new HttpTrafficControlService(httpClient);
                cameras[i] = new CameraSimulation(i + 1, trafficControlService);
            }
            Parallel.ForEach(cameras, cam => cam.Start());

            Task.Run(() => Thread.Sleep(Timeout.Infinite)).Wait();
        }
    }
}

import { AggressiveMergeBehavior } from './merge-aggressive.js';

export const Settings =
{
    laneCount: 5,
    carCount: 15,
    defaultCars:
        [
            {
                initialSpeed: {
                    minimum: 60,
                    maximum: 85
                },
                maximumSpeed: 85,
                acceleration: 50,
                maxSafeDistance: 2,
                brakeThreshold: 4,
                mergeRightThreshold: 0.6,
                model: 'truck',
                color: 'lightgreen',
                lanes: [3, 4],
                sourceImages: [
                    { key: 'garbage' },
                    { key: 'schoolbus' },
                    { key: 'truck' }
                ]
            },
            // Law abiding citizen
            {
                initialSpeed:
                {
                    minimum: 90,
                    maximum: 110
                },
                maximumSpeed: 110,
                acceleration: 100,
                maxSafeDistance: 2,
                brakeThreshold: 4,
                mergeRightThreshold: 0.8,
                model: 'car',
                color: 'yellow',
                sourceImages: [
                    { key: 'ambulance' },
                    { key: 'crossover', paintKey: 'paint-general' },
                    { key: 'mini', paintKey: 'paint-general' },
                    { key: 'minivan', paintKey: 'paint-general' },
                    { key: 'pickup', paintKey: 'paint-general' },
                    { key: 'sedan', paintKey: 'paint-general' },
                    { key: 'semitruck' },
                ]
            },
                //     // Fast & furious
            {
                initialSpeed:
                {
                    minimum: 120,
                    maximum: 130
                },
                maximumSpeed: 180,
                acceleration: 150,
                brakeThreshold: 4,
                maxSafeDistance: 2,
                mergeRightThreshold: 1,
                mergeBehavior: new AggressiveMergeBehavior(),
                model: 'suv',
                color: 'Salmon',
                lanes: [0, 1, 2],
                overtakeOnRightSide: true,
                maxMergeRightLane: 2,
                sourceImages: [
                    { key: 'hummer', paintKey: 'paint-general' }
                ]
            }
        ],
    speedingCar: {
    },
    maximumSpeedIncrementForLeftLanes: 5,
    timeScale: 1
}
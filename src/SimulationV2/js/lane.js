import { Merge } from './merge.js';
import { Settings } from './settings.js';
import { Utils } from './utils.js';

const topMargin = 420;

export class Lane extends Phaser.GameObjects.TileSprite {

    constructor(scene, number, lanes) {
        super(scene, 600, (number * 33) + topMargin, 1200, 33, 'road-middle'); // TODO add a little x offset

        this.number = number;
        this.lanes = lanes;
        this.middleOfLane = this.y + Math.floor(this.height / 2) - 5;
        this.cars = [];

        // ...
        scene.add.existing(this);
    }

    hasRoomForNewCar() {
        if (this.cars.length > 0) {
            const lastCar = this.cars[0];
            if (lastCar.body.x > 150) {
                return true;
            }
        }

        return this.cars.length == 0;
    }

    getAdditionalKilometersPerHourForMaximumSpeed() {
        return (this.lanes.length - this.number - 1) * Settings.maximumSpeedIncrementForLeftLanes;
    }

    addNewCar(car) {
        this.cars.unshift(car);
    }

    hasLeftLane() {
        return this.getLeftLane() !== null;
    }

    hasRightLane() {
        return this.getRightLane() !== null;
    }

    getLeftLane() {
        if (this.number > 0) {
            return this.lanes[this.number - 1];
        }
        return null;
    }

    getRightLane() {
        if (this.number < this.lanes.length - 1) {
            return this.lanes[this.number + 1];
        }
        return null;
    }

    tryMerge2(car, to) {

        var merge = new Merge(car, this, to);

        return this.tryMerge(merge);
    }

    tryMergeLeft(car) {
        if (this.number === 0) {
            return null;
        }

        var merge = new Merge(car, this, this.lanes[this.number - 1]);

        return this.tryMerge(merge);
    }

    tryMergeRight(car) {
        if (this.number === this.lanes.length - 1) {
            return null;
        }

        var merge = new Merge(car, this, this.lanes[this.number + 1]);

        if (merge.isSafe()) {

            // Add car to merge lane so that other vehicles won't crash into it.
            merge.to.insertCar(car);
            return merge;
        }

        return null;


        var mergeLane = this.lanes[this.number + 1];

        var mergeBehindCar = mergeLane.getPreviousCarFromPosition(car.body.x);
        var mergeInFrontOfCar = mergeLane.getNextCarFromPosition(car.body.x);

        var mergeStatus = 'merging right';
        if (mergeBehindCar) {
            mergeStatus += ' | merging in front of ' + mergeBehindCar.id + ' with distance of ' + Math.floor(Utils.pixelsToMeters(car.distanceTo(mergeBehindCar)));
        }
        if (mergeInFrontOfCar) {
            mergeStatus += ' | merging behind ' + mergeInFrontOfCar.id + ' with distance of ' + Math.floor(Utils.pixelsToMeters(car.distanceTo(mergeInFrontOfCar)));
        }

        // Don't want to crash into another car.
        if ((mergeBehindCar && car.distanceTo(mergeBehindCar) < car.getSafeDistance())
            || (mergeInFrontOfCar && mergeInFrontOfCar.distanceTo(car) < car.getSafeDistance())) {
            return null;
        }

        // var mergeBehindCar = mergeLane.getCarInFrontOf(car);
        // if (mergeBehindCar && car.distanceTo(mergeBehindCar) < car.getMinimumDistanceForRightMerge())
        // {
        //     return null;

        // }

        // Check that we don't crash into another car.
        // if (mergeLane.cars.some(c => c.inDangerZone(car)))
        // {
        //     return null;
        // }

        mergeLane.insertCar(car);

        var index = mergeLane.getCarIndex(car);
        console.assert(index != -1, "Car should be added to merge lane.");
        if (index > 0) {
            console.assert(car.inFrontOf(mergeLane.cars[index - 1]), "Car should be added at correct position");
        }
        else if (index + 1 < mergeLane.cars.length) {
            console.assert(mergeLane.cars[index + 1].inFrontOf(car), "Car should be added at correct position");
        }

        car.mergeStatus = mergeStatus;

        return mergeLane;
    }

    tryMerge(merge) {
        if (merge.isSafe()) {

            // Add car to merge lane so that other vehicles won't crash into it.
            merge.to.insertCar(merge.car);
            return merge;
        }

        return null;
    }

    insertCar(car) {
        var index = car.lane.getCarIndex(car);
        console.assert(index >= 0, "Merging car should have index in own lane");

        for (let i = 0; i < this.cars.length; i++) {
            if (this.cars[i].inFrontOf(car)) {
                this.cars.splice(i, 0, car);
                return;
            }
        }

        this.cars.push(car);
    }

    removeCar(car) {
        const index = this.getCarIndex(car);
        if (index >= 0) {
            this.cars.splice(index, 1);
        }
    }

    getCarIndex(car) {
        return this.cars.findIndex(c => c === car);
    }

    getNextCar(car) {
        const index = this.getCarIndex(car);
        if (this.cars.length >= index + 1) {
            return this.cars[index + 1];
        }
        return null;
    }

    getPreviousCar(car) {
        const index = this.getCarIndex(car);
        if (index > 0) {
            return this.cars[index - 1];
        }
        return null;
    }

    getNextCarFromPosition(x) {
        for (let i = 0; i < this.cars.length; i++) {
            if (this.cars[i].body.x > x) {
                return this.cars[i];
            }
        }
        return null;
    }

    getPreviousCarFromPosition(x) {
        for (let i = this.cars.length - 1; i >= 0; i--) {
            if (this.cars[i].body.x < x) {
                return this.cars[i];
            }
        }
        return null;
    }

    getMiddleOfLanePosition() {
        return this.middleOfLane;// ((this.number + 1) * 30) + 100;
    }

    removeFrontCar() {
        this.cars.pop();
    }
}

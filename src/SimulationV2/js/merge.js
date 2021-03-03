import { Utils } from "./utils.js";

export class Merge {
    
    constructor(car, from, to) {
        this.car = car;
        this.from = from;
        this.to = to;
    }

    isSafe() {

        
        var text = 'isSafe? id:' + this.car.id;
        
        // Don't want to cut off the car in the other lane.
        var previousCar = this.to.getPreviousCarFromPosition(this.car.body.x);
        if (previousCar
            && (previousCar.distanceTo(this.car) < this.car.getSafeDistance())) {
              //  || previousCar.body.acceleration.x > this.car.body.acceleration.x)) {
            return false;
        }

        text += ' from lane: ' + this.from.number;
        text += ' to lane: ' + this.to.number;
        
        if (previousCar)
        {
            text += ' prev: ' + previousCar.id;
            text += ' x: ' + this.car.body.x;
            text += ' prevX: ' + previousCar.body.x;
            text += ' prevWidth: ' + previousCar.displayWidth;
        }
        
        var nextCar = this.to.getNextCarFromPosition(this.car.body.x);
        if (nextCar)
        {


            // Don't want to crash into the car in front of us in the other lane.
            if (this.car.distanceTo(nextCar) < this.car.getSafeDistance()) {
                return false;
            }

            // TODO Car.relativeVelocityTo
            // var relativeVelocity = nextCar.body.velocity.x - this.car.body.velocity.x;
            // if (Utils.velocityToKilometersPerHour(relativeVelocity) > 10) {
            //     return false;
            // }

            // if (Utils.velocityToKilometersPerHour(nextCar.body.velocity.x) < this.car.persona.maximumSpeed) {
            //     return false;
            // }

        }
        
        if (nextCar)
        {
            text += ' next: ' + nextCar.distanceTo(this.car); 
        }

        var mergeStatus = 'merging right';
        if (previousCar) {
            mergeStatus += ' | merging in front of ' + previousCar.id + ' with distance of ' + this.car.distanceTo(previousCar);
        }
        if (nextCar) {
            mergeStatus += ' | merging behind ' + nextCar.id + ' with distance of ' + this.car.distanceTo(nextCar);
        }

        // this.breakForDebug(text);

//        console.log(text);
        return true;
    }

    continueMerge() {

        if (this.to.number > this.from.number) {

            if (this.car.y >= this.to.getMiddleOfLanePosition()) {

                this.car.setAccelerationY(0);
                this.car.setVelocityY(0);
                this.car.setPosition(this.car.x, this.to.getMiddleOfLanePosition());

                var x = this.from.cars.length;

                this.from.removeCar(this.car);

                console.assert(x > this.from.cars.length, "Should have deleted");


                this.car.lane = this.to;
    //            this.breakForDebug('finish merge');
                return true;
            } else {
                this.car.setAccelerationY(this.car.body.velocity.x / 2);
                return false;
            }
        } else {

            if (this.car.y <= this.to.getMiddleOfLanePosition()) {
                this.car.setAccelerationY(0);
                this.car.setVelocityY(0);
                this.car.setPosition(this.car.x, this.to.getMiddleOfLanePosition());

                var x = this.from.cars.length;

                this.from.removeCar(this.car);

                console.assert(x > this.from.cars.length, "Should have deleted");


                this.car.lane = this.to;
    //            this.breakForDebug('finish merge');
                return true;
            } else {
                this.car.setAccelerationY(-this.car.body.velocity.x / 2);
                return false;
            }

        }
    }

    breakForDebug(msg) {
        console.log('breakpoint hit for car ' + this.car.id + ': ' + msg);
        this.car.scene.scene.pause();
        this.car.scene.scene.launch('debugScene');
    }
}
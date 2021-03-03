import { Utils } from './utils.js';

export let Car = new Phaser.Class({

    Extends: Phaser.Physics.Arcade.Image,

    initialize: function Car(scene) {
        this.id = Utils.getRandomInteger(1000, 9999);

        Phaser.Physics.Arcade.Image.call(this, scene, 0, 0, 'car');

        this.setOrigin(0, 1);
        this.setScale(1);


        this._temp = new Phaser.Math.Vector2();


        var style = { font: "14px Arial", fill: "Black", wordWrap: true, align: "center", backgroundColor: "#ffff00" };
        this.text = this.scene.add.text(0, 0, "100 km/h", style);
    },

    drive: function (licensePlate, lane, persona) {
        this.lane = lane;
        this.persona = persona;

        this.id = licensePlate;

        this.startTime = Date.now();

        this.log = [];

        // if (this.persona.model === 'car') {
        //     console.log(this.displayWidth);
        // }

        this.setTexture(persona.imageKeys[Utils.getRandomInteger(0, persona.imageKeys.length - 1)]);
        this.setBodySize(this.displayWidth, this.displayHeight);


        this.merge = null;

        // TODO remove
        for (let i = 0; i < this.lane.lanes; i++) {
            console.assert(lane.getCarIndex(this) != -1, "Destroyed car should not be part of any lane.");
        }

        const initialSpeed = Utils.kilometersPerHourToVelocity(
            Utils.getRandomInteger(persona.initialSpeed.minimum, persona.initialSpeed.maximum));

        // this.setAngle(0);
        // this.setVelocity(speed, 0);
        // this.setAcceleration(0, 0);
        this.body.reset(-this.displayWidth, lane.getMiddleOfLanePosition());
        this.setVelocityX(initialSpeed);
        // this.body.setMaxSpeed(Utils.kilometersPerHourToVelocity(persona.maximumSpeed));

        //        this.setPosition(-this.displayWidth, lane.getMiddleOfLanePosition());

        this.setActive(true);
        this.setVisible(true);

        // Add car to lane.
        this.lane.addNewCar(this);

        var index = this.lane.getCarIndex(this);
        //console.assert(index == 0, "Index of new car should be 0.");

    },

    inDangerZone: function (car) {
        // If the distance is less than a car-length, we're in danger.
        // TODO Integrate with getSafeDistance?
        return distanceTo(car) < (this.displayWidth);
    },

    inFrontOf: function (car) {
        //        console.log(this.body.x + ' > ' + car.body.x);

        var result = this.body.x > car.body.x;

        return result;
    },

    distanceTo: function (car) {
        if (this.inFrontOf(car)) {
            return this.x - car.x - car.displayWidth;
        } else {
            return car.x - this.x - this.displayWidth;
        }
    },

    timeTo: function (car) {
        const relativeVelocity = Math.abs(this.body.velocity.x - car.body.velocity.x);
        const distance = this.distanceTo(car);

        return distance / relativeVelocity;
    },

    getSafeDistance: function () {

//        return 10;
        let safeDistanceInMeters = Utils.velocityToKilometersPerHour(this.body.velocity.x) / 4;
        if (this.persona.maxSafeDistance && safeDistanceInMeters > this.persona.maxSafeDistance) {
            safeDistanceInMeters = this.persona.maxSafeDistance;
        }
       return Math.ceil(Utils.metersToPixels(safeDistanceInMeters));
    },

    getMinimumDistanceForRightMerge: function () {
        return this.getSafeDistance();// * this.persona.safeDistanceFactor;
    },

    getMaximumVelocity: function() {
        let result = this.persona.maximumSpeed;
        result += this.lane.getAdditionalKilometersPerHourForMaximumSpeed();
        result = Utils.kilometersPerHourToVelocity(result);
        return result;
    },

    getRelativeVelocityTo: function(nextCar) {
        return this.body.velocity.x - nextCar.body.velocity.x;
    },

    getCarInFront: function (includeCarInLeftLane) {
        let result = this.lane.getNextCar(this);

        if (this.merge) {
            var carInMergeLane = this.merge.to.getNextCar(this);
            if (carInMergeLane) {
                if (!result || result.inFrontOf(carInMergeLane)) {
                    result = carInMergeLane;
                }
            }
        }
        else if (this.lane.number > 0 && includeCarInLeftLane) {
            var carInLeftLane = this.lane.lanes[this.lane.number - 1].getNextCarFromPosition(
                this.body.x + this.displayWidth);
            if (carInLeftLane) {
                if (!result || result.inFrontOf(carInLeftLane)) {
                    result = carInLeftLane;
                }
            }
        }

        if (result) {
            this.carInFrontLog = result.id + ' (' + this.distanceTo(result) + ')';
        } else {
            this.carInFrontLog = 'none';
        }

        return result;
    },

    getCarBehind: function () {
        let result = this.lane.getPreviousCar(this);

        if (this.mergeRightLane) {
            var carInRightLane = this.mergeRightLane.getPreviousCar(this);
            if (carInRightLane) {
                if (!result || carInRightLane.inFrontOf(result)) {
                    result = carInRightLane;
                }
            }
        }

        return result;
    },

    update: function (time, delta) {
        console.assert(this.lane.getCarIndex(this) != -1, "Car should be part of a lane.");

        this.setDepth(this.lane.number);

        this.text.setPosition(this.body.x, this.body.y - 20);
        this.text.setDepth(this.lane.number + 1);


        this.adjustSpeed();

        if (this.merge) {
            if (this.merge.continueMerge()) {
                this.merge = null;
            }
        } else if (this.persona.mergeBehavior) {// this.x > 150) {
            this.merge = this.persona.mergeBehavior.tryMerge(this);
        }

        if (this.x > this.scene.physics.world.bounds.right) {
            // Remove car from lane. // TODO remove this car

            const distance = Utils.pixelsToKilometers(this.scene.physics.world.bounds.width);
            const elapsedTime = (Date.now() - this.startTime) / 3600000;
            const averageSpeed = distance / elapsedTime

            console.log(`${this.id} had average speed of ${Math.floor(averageSpeed)} km/h`);

            var x = this.lane.cars.length;
            this.lane.removeCar(this);
            console.assert(x > this.lane.cars.length, "Should have deleted");

            if (this.merge) {
                var x = this.merge.to.cars.length;
                this.merge.to.removeCar(this);
                console.assert(x > this.merge.to.cars.length, "Should have deleted");
            }

            this.merge = null;

            this.setActive(false);
            this.setVisible(false);
            this.body.stop();
        }
    },

    adjustSpeed: function () {

        let accelerationX;
        let velocityX = this.body.velocity.x;

        this.text.setText('');
        let breakForDebug = false;

        const nextCar = this.getCarInFront(!this.persona.overtakeOnRightSide);
        if (nextCar) {

            var safeDistance = this.getSafeDistance();
            
            var distanceToNextCar = this.distanceTo(nextCar);
            var distanceToSafePosition = distanceToNextCar - safeDistance;

            var relativeVelocityToNextCar = velocityX - nextCar.body.velocity.x;

            // Check if we're too close to the next car.
            if (distanceToSafePosition < 0) {

                if (this.body.x > 150) {
                   // breakForDebug = true;
                }

                // If we're going faster than the next car, stop doing that by matching the
                // next car's speed...
                if (relativeVelocityToNextCar > 0) {
                    velocityX = nextCar.body.velocity.x;
                }

                // ...and brake to increase distance.
                // if (Math.ceil(distanceToSafePosition) == 0) {
                //     accelerationX = 0;
                // } else {
                    accelerationX = Math.min(-50, nextCar.body.acceleration.x);
                //}
            }
            // } else if (Math.floor(distanceToSafePosition) == 0) {
            //     velocityX = nextCar.body.velocity.x;
            //     accelerationX = 0;
            // }
            // We're not too close yet, but gaining.
            else if (relativeVelocityToNextCar > 0) {

                // If the distance is less than twice the minimum safe distance, start braking.
                if (distanceToSafePosition < safeDistance * this.persona.brakeThreshold)
                {
                    // Calculate the time it takes to reach the minimum safe distance.
                    var timeToSafePosition = distanceToSafePosition / relativeVelocityToNextCar;

                    // Brake with the appropriate force.
                    accelerationX = -(relativeVelocityToNextCar / timeToSafePosition);

                    // If the next car is braking as well, add that to the acceleration.
                    if (nextCar.body.acceleration.x < 0) {
                        accelerationX += nextCar.body.acceleration.x;
                    }
                } 


            // Check if we're getting closer to the next car.
            var relativeVelocityToNextCar = velocityX - nextCar.body.velocity.x;
            if (relativeVelocityToNextCar > 0 ) {
                
                }
            }
        }


        let accelerationXCalc = accelerationX;


        // If no braking manoeuvre has started, we can safely go a bit faster.
        if (accelerationX === undefined) {
            accelerationX = this.persona.acceleration;
        }

        // Never go over the driver's maximum speed, though.
        const maximumVelocity = this.getMaximumVelocity();
        if (velocityX >= maximumVelocity) {
            accelerationX = Math.min(accelerationX, 0);
            velocityX = maximumVelocity;
        }

        // Never move backwards.
        if (velocityX < 0) {
            accelerationX = 0;
            velocityX = 0;
        }

        if (breakForDebug) {
            this.breakForDebug('emergency brake: ' + this.status);
                        console.log('car in front: ' + this.carInFrontLog);
                        for (let logEntry of this.log) {
                            console.log(logEntry);
                        }
//                        console.log(this.log);
                        console.log('calculated a: ' + accelerationXCalc);
                        console.log('final a: ' + accelerationX);
                        console.log('🚘 Debug info for car ' + this.id + ':\n%O', this.getDebugInfo());
        }


        this.setVelocityX(velocityX);
        this.setAccelerationX(accelerationX);
    },


//     adjustSpeed: function () {

//         let accelerationX;
//         let velocityX = this.body.velocity.x;

//         this.text.setText('');

//         let breakForDebug = false;

//         const nextCar = this.getCarInFront(!this.persona.overtakeOnRightSide);
//         if (nextCar) {

//             var safeDistance = this.getSafeDistance();
            
//             var distanceToNextCar = this.distanceTo(nextCar);
//             var distanceToSafePosition = distanceToNextCar - safeDistance;

//             // Check if we're getting closer to the next car.
//             var relativeVelocityToNextCar = velocityX - nextCar.body.velocity.x;
//             if (relativeVelocityToNextCar > 0 ) {
                
//                 // Check if we're too close to the next car.
//                 if (distanceToSafePosition < 0) {

//                     if (this.body.x > 150) {
//                         breakForDebug = true;
//                     }

//                     // If we're going faster than the next car, stop doing that by matching the
//                     // next car's speed...
//                     if (relativeVelocityToNextCar > 0) {
//                         velocityX = nextCar.body.velocity.x;
//                     }

//                     // ...and brake to increase distance.
//                     if (Math.ceil(distanceToSafePosition) == 0) {
//                         accelerationX = 0;
//                     } else {
//                         accelerationX = Math.min(-50, nextCar.body.acceleration.x);
//                     }
//                 } else if (Math.floor(distanceToSafePosition) == 0) {
//                     velocityX = nextCar.body.velocity.x;
//                     accelerationX = 0;
//                 }
//                 // We're not too close yet, but gaining.
//                 else {

//                     // If the distance is less than twice the minimum safe distance, start braking.
//                     if (distanceToSafePosition < safeDistance * this.persona.brakeThreshold)
//                     {
//                         // Calculate the time it takes to reach the minimum safe distance.
//                         var timeToSafePosition = distanceToSafePosition / relativeVelocityToNextCar;

//                         // Brake with the appropriate force.
//                         accelerationX = -(relativeVelocityToNextCar / timeToSafePosition);

//                         // If the next car is braking as well, add that to the acceleration.
//                         if (nextCar.body.acceleration.x < 0) {
//                             accelerationX += nextCar.body.acceleration.x;
//                         }

//                         // this.text.setText(timeToSafePosition);
//                         //this.text.setBackgroundColor(distanceToSafePosition < 200 ? 'red' : 'white');
                        
//                         var logEntry = 'c: ' + nextCar.id 
//                             + ' v: ' + this.body.velocity.x
//                             + ' nv: ' + nextCar.body.velocity.x
//                             + ' sd: ' + this.getSafeDistance()
//                             + ' d: ' + distanceToSafePosition
//                             + ' rv: ' + relativeVelocityToNextCar
//                             + ' t: ' + timeToSafePosition
//                             + ' a: ' + accelerationX;

//                         if (this.log.length == 0 || this.log[this.log.length - 1] !== logEntry) {
//                             this.log.push(logEntry);
//                         }


//                         // this.status = 'braking from distance: ' + this.braking;
//                     } 
//                     // else {
//                     //     this.status = 'gaining, but safe';
//                     // }
//                 }
//             }
//         }


//         let accelerationXCalc = accelerationX;


//         // If no braking manoeuvre has started, we can safely go a bit faster.
//         if (accelerationX === undefined) {
//             accelerationX = this.persona.acceleration;
//         }

//         // Never go over the driver's maximum speed, though.
//         const maximumVelocity = this.getMaximumVelocity();
//         if (velocityX >= maximumVelocity) {
//             accelerationX = Math.min(accelerationX, 0);
//             velocityX = maximumVelocity;
//         }

//         // Never move backwards.
//         if (velocityX < 0) {
//             accelerationX = 0;
//             velocityX = 0;
//         }

//         if (breakForDebug) {
//             this.breakForDebug('emergency brake: ' + this.status);
//                         console.log('car in front: ' + this.carInFrontLog);
//                         for (let logEntry of this.log) {
//                             console.log(logEntry);
//                         }
// //                        console.log(this.log);
//                         console.log('calculated a: ' + accelerationXCalc);
//                         console.log('final a: ' + accelerationX);
//                         console.log('🚘 Debug info for car ' + this.id + ':\n%O', this.getDebugInfo());
//         }


//         this.setVelocityX(velocityX);
//         this.setAccelerationX(accelerationX);
//     },


//     tryMerge: function () {

//         if (this.persona.model !== 'suv' || this.merge) {
//             return;
//         }

//         // If we're a maximum speed or still accelerating, just continue.
//         if (this.body.velocity.x >= this.getMaximumVelocity() || this.body.acceleration.x > 0) {
//             return;
//         }

//         let furthestCar = this.getCarInFront();
//         if (furthestCar) {

//             if (furthestCar.persona.model === this.persona.model) {
//                 return;
//             }

//             const leftLane = this.lane.getLeftLane();
//             if (leftLane) {
//                 const nextCarOnLeft = leftLane.getNextCarFromPosition(this.body.x);
//                 if (nextCarOnLeft && nextCarOnLeft.inFrontOf(furthestCar)) {
//                     furthestCar = nextCarOnLeft;
//                 }
//             }

//             const rightLane = this.lane.getRightLane();
//             if (rightLane) {
//                 const nextCarOnRight = rightLane.getNextCarFromPosition(this.body.x);
//                 if (nextCarOnRight && nextCarOnRight.inFrontOf(furthestCar)) {
//                     furthestCar = nextCarOnRight;
//                 }
//             }
//         }

//         if (furthestCar && furthestCar.lane !== this.lane) {
//             this.merge = this.lane.tryMerge2(this, furthestCar.lane);
//             if (this.merge) {
//                 // this.breakForDebug('merge2');
//                 // console.log(this.merge);
//             }
//         }
//     },

//     tryMergeRight: function () {

//         if (!this.lane.hasRightLane()) {
//             return;
//         }

//         // If we're currently braking, don't merge right.
//         if (this.body.acceleration.x < 0) {
//             return;
//         }

//         // If we're want to go faster, don't merge right.
//         if (this.getMaximumVelocity() * this.persona.mergeRightThreshold < this.body.velocity.x) {
//             return;
//         }

//         // If the car in the right lane is going too slow, don't merge right.
//         const nextCarOnRight = this.lane.getRightLane().getNextCarFromPosition(this.body.x);
//         if (nextCarOnRight) {
//             const relativeVelocity = this.getRelativeVelocityTo(nextCarOnRight);
//             if (relativeVelocity < 0) {
//                 return;
//             }
// //             if (this.distanceTo(nextCarOnRight) < this.getSafeDistance() * 10) {
// //                 return;
// // //                    this.merge = this.lane.tryMergeRight(this);
// //                 // if (this.merge) this.breakForDebug('merge right: ' + nextCarOnRight.id);


// //             }
//         }

//         this.merge = this.lane.tryMergeRight(this);
//     },

    breakForDebug: function (msg) {
        console.log('breakpoint hit for car ' + this.id + ': ' + msg);
        console.log('🚘 Debug info for car ' + this.id + ':\n%O', this.getDebugInfo());
        this.scene.scene.pause();
        this.scene.scene.launch('debugScene');
    },

    getDebugInfo: function (indentation) {
        const result =
        {
            accelerationX: this.body.acceleration.x,
            displayWidth: this.displayWidth,
            image: this,
            position: this.lane.getCarIndex(this),
            safeDistance: this.getSafeDistance() + ' (' + Utils.pixelsToMeters(this.getSafeDistance()) + ' m)',
            velocityX: this.body.velocity.x + ' (' + Utils.velocityToKilometersPerHour(this.body.velocity.x) + ' km/h)',
            x: this.x
        };

        var lane = this.lane.number;
        if (this.merge) {
            lane += ' (merging into lane ' + this.merge.to.number + ' at position ' + this.merge.to.getCarIndex(this) + ')';
        }
        result.lane = lane;

        var carInFront = this.getCarInFront(false);
        if (carInFront) {

            let carInFrontText = carInFront.id
                + ' (distance ' + this.distanceTo(carInFront)
                + ', time ' + this.timeTo(carInFront)
                + ', lane ' + carInFront.lane.number;

            if (carInFront.merge) {
                carInFrontText += ', merging into lane ' + carInFront.merge.to.number;
            }

            result.carInFront = carInFrontText + ')';
        };

        var carBehind = this.getCarBehind();
        if (carBehind) {
            let carBehindText = carBehind.id + ' ('
                + Math.floor(Utils.pixelsToMeters(this.distanceTo(carBehind))) + 'm, lane '
                + carBehind.lane.number;

            if (carBehind.merge) {
                carBehindText += ', merging into lane ' + carBehind.merge.to.number;
            }

            result.carBehind = carBehindText + ')';
        };

        if (this.lane.number < this.lane.lanes.length - 1) {
            var rightLanePrevCar = this.lane.lanes[this.lane.number + 1].getPreviousCarFromPosition(this.body.x);
            if (rightLanePrevCar) {
                result.rightLanePrevCar = rightLanePrevCar.id;
            }
        
        }

        if (this.merge && this.merge.mergeStatus) {
            result.mergeStatus = this.mergeStatus;
        }

        return result;
    }
});
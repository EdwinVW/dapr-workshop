import { Car } from './car.js';
import { Lane } from './lane.js';
import { Settings } from './settings.js';
import { Utils } from './utils.js';

export let TestScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function TestScene() {
        Phaser.Scene.call(this, { key: 'testScene' });

    },

    preload: function () {
        this.load.image('car', 'assets/car.png');
        this.load.image('subcompact', 'assets/subcompact.png');
        this.load.image('suv', 'assets/suv.png');
        this.load.image('truck', 'assets/truck.png');
    },

    create: function () {
        this.physics.world.setBounds(0, 0, 1500, 600);
        this.physics.world.timeScale = Settings.timeScale;

        this.truck = this.physics.add.sprite(450, 250, 'truck');
        this.truck.body.velocity.x = 100;

        this.car = this.physics.add.sprite(-50, 250, 'car');
        this.car.body.velocity.x = 500;
    },

    update: function () {

        const minSafeDistance = 10;

        let accelerationX;
        let velocityX = this.car.body.velocity.x;

        var safeDistance = Math.max(this.car.body.velocity.x / 2, minSafeDistance);
        
        var distanceToNextCar = this.truck.body.x - this.car.body.x - this.car.displayWidth;
        var distanceToSafePosition = distanceToNextCar - safeDistance;
        
        var relativeVelocityToNextCar = this.car.body.velocity.x - this.truck.body.velocity.x;

        // Check if we're too close to the next car.
        if (distanceToSafePosition <= 0) {

            // If we're going faster than the next car, stop doing that by matching the
            // next car's speed...
            if (relativeVelocityToNextCar > 0) {
                velocityX = this.truck.body.velocity.x;
            }

            // ...and brake to increase distance.
            accelerationX = -10;
        }
        // If we're not too close yet, check if we're going faster than the car in front.
        else if (relativeVelocityToNextCar > 0) {

            // If the distance is less than twice the minimum safe distance, start braking.
            if (distanceToNextCar < safeDistance * 2)
            {
                // Calculate the time it takes to reach the minimum safe distance.
                var timeToSafePosition = distanceToSafePosition / relativeVelocityToNextCar;

                // Brake with the appropriate force.
                accelerationX = -(relativeVelocityToNextCar / timeToSafePosition);
            }
        }

        // If no braking manoeuvre has started, we can safely go a bit faster.
        if (accelerationX === undefined) {
            accelerationX = 50;
        }

        // Never go over the driver's maximum speed, though.

        this.car.setVelocityX(velocityX);
        this.car.setAccelerationX(accelerationX);
        
        


        // if (this.car.body.velocity.x < 1) {
        //     this.car.setVelocityX(1);

        //     // should not be necessary?
        //     this.car.setAccelerationX(0);
        // }
    }
});
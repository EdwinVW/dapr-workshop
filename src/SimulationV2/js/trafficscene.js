import { Car } from './car.js';
import { CarPainter } from './car-painter.js'
import { Lane } from './lane.js';
import { Settings } from './settings.js';
import { Utils } from './utils.js';

export let TrafficScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function TrafficScene() {
        Phaser.Scene.call(this, { key: 'trafficScene' });

        this.lanes = [];
    },

    preload: function () {

        this.load.image('background', 'assets/background.png');
        this.load.image('road-middle', 'assets/road-middle.png');
        this.load.image('road-bottom', 'assets/road-bottom.png');

        for (let carSettings of Settings.defaultCars) {
            for (let sourceImage of carSettings.sourceImages) {
                this.load.image(sourceImage.key, 'assets/' + sourceImage.key + '.png');

                if (sourceImage.paintKey) {
                    this.load.image(sourceImage.paintKey, 'assets/' + sourceImage.paintKey + '.png');
                }
            }
//            carSettings.imageKeys = carPainter.paintCar(carSettings);
        }
    },

    create: function () {
//        this.physics.world.setBounds(0, 0, 1500, 600);
        this.physics.world.timeScale = Settings.timeScale;

        this.add.image(600, 200, 'background');

        for (let i = 0; i < Settings.laneCount; i++) {
            this.lanes.push(new Lane(this, i, this.lanes));
        }

        const tileSprite2 = this.add.tileSprite(600, 400, 1200, 7, 'road-bottom');
        tileSprite2.setDepth(0);

        const tileSprite = this.add.tileSprite(600, 565, 1200, 7, 'road-bottom');
        tileSprite.setDepth(600);
        
        const carPainter = new CarPainter(this);
        for (let carSettings of Settings.defaultCars) {
            carSettings.imageKeys = carPainter.paintCar(carSettings);
        }

        this.cars = this.physics.add.group({
            classType: Car,
            maxSize: Settings.carCount,
            runChildUpdate: true
        });

        this.input.keyboard.on('keydown-D', (event) => {
            this.scene.pause();
            this.scene.launch('debugScene');
        }, this);

    },

    update: function () {
        const lane = this.findLaneForNewCar();
        if (lane) {
            var car = this.cars.get();
            if (car) {
                const carTypes = this.getCarTypesForLane(lane);
                const carTypeIndex = Utils.getRandomInteger(0, carTypes.length - 1);
                car.drive(this.generateRandomLicensePlate(), lane, carTypes[carTypeIndex]);
            }
        }
    },

    findLaneForNewCar: function () {
        for (let lane of this.lanes) {
            if (lane.hasRoomForNewCar()) {
                return lane;
            }
        }

        return null;
    },

    getCarTypesForLane: function (lane) {
        const carTypes = [];
        for (let carType of Settings.defaultCars) {
            if (!carType.lanes || carType.lanes.includes(lane.number)) {
                carTypes.push(carType);
            }
        }


        return carTypes;
    },

    generateRandomLicensePlate: function() {
        const type = Utils.getRandomInteger(1, 8);
        let result;
        switch (type)
        {
            case 1: // 99-AA-99
                result = `${this.generateLicensePlateNumbers(99)}-${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateNumbers(99)}`;
                break;
            case 2: // AA-99-AA
                result = `${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateNumbers(99)}-${this.generateLicensePlateCharacters(2)}`;
                break;
            case 3: // AA-AA-99
                result = `${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateNumbers(99)}`;
                break;
            case 4: // 99-AA-AA
                result = `${this.generateLicensePlateNumbers(99)}-${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateCharacters(2)}`;
                break;
            case 5: // 99-AAA-9
                result = `${this.generateLicensePlateNumbers(99)}-${this.generateLicensePlateCharacters(3)}-${this.generateLicensePlateNumbers(9)}`;
                break;
            case 6: // 9-AAA-99
                result = `${this.generateLicensePlateNumbers(9)}-${this.generateLicensePlateCharacters(3)}-${this.generateLicensePlateNumbers(99)}`;
                break;
            case 7: // AA-999-A
                result = `${this.generateLicensePlateCharacters(2)}-${this.generateLicensePlateNumbers(999)}-${this.generateLicensePlateCharacters(1)}`;
                break;
            case 8: // A-999-AA
                result = `${this.generateLicensePlateCharacters(1)}-${this.generateLicensePlateNumbers(999)}-${this.generateLicensePlateCharacters(2)}`;
                break;
        }

        return result;
    },

    generateLicensePlateCharacters: function(count) {
        const validLicenseNumberChars = "DFGHJKLNPRSTXYZ";
        let result = '';
        for (let i = 0; i < count; i++)
        {
            result += validLicenseNumberChars[Utils.getRandomInteger(0, validLicenseNumberChars.length - 1)];
        }
        return result;
    },

    generateLicensePlateNumbers: function(max) {
        const length = max.toString().length;
        return Utils.getRandomInteger(0, max).toString().padStart(length, '0');
    }

});
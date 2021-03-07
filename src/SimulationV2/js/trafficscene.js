import { Car } from './car.js';
import { CarPainter } from './car-painter.js'
import { Lane, laneHeight, laneMarginTop } from './lane.js';
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
        this.load.image('structure-overhead', 'assets/structure-overhead.png');
        this.load.image('structure-pole', 'assets/structure-pole.png');

        for (let carSettings of Settings.carTypes) {
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
        this.physics.world.setBounds(0, 0, 2000, 600);
        this.cameras.main.setBounds(0, 0, 2000, 600);

        this.add.image(600, 200, 'background');

        for (let i = 0; i < Settings.laneCount; i++) {
            this.lanes.push(new Lane(this, i, this.lanes));
        }

        this.drawCameraStructure(150);
        this.drawCameraStructure(600);
        this.drawCameraStructure(1050);

        
        const tileSprite2 = this.add.tileSprite(600, 400, 1200, 7, 'road-bottom');
        tileSprite2.setDepth(0);
        
        const y = laneMarginTop + (this.lanes.length * laneHeight);
        const tileSprite = this.add.tileSprite(600, y - 20, 1200, 7, 'road-bottom');
        tileSprite.setDepth(600);
        
        const carPainter = new CarPainter(this);
        for (let carSettings of Settings.carTypes) {
            carSettings.imageKeys = carPainter.paintCar(carSettings);
        }

        this.carTypeLookup = this.createCarTypeLookup();
        console.log(this.carTypeLookup);

        this.cars = this.physics.add.group({
            classType: Car,
            maxSize: Settings.carCount,
            runChildUpdate: true
        });

        this.input.keyboard.on('keydown-D', (event) => {
            this.scene.pause();
            this.scene.launch('debugScene');
        }, this);

        const cursors = this.input.keyboard.createCursorKeys();

        const controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            zoomSpeed: 0.02,
            acceleration: 1,
            drag: 0.0005,
            maxSpeed: 10
        };

        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
    },

    drawCameraStructure: function (x) {

        const y = laneMarginTop + (this.lanes.length * laneHeight) - 45;
        console.log(y);

        var poleNear = this.add.image(x, y, 'structure-pole');
        poleNear.setDepth(1000);

        let structureImage;
        for (let i = 0; i < this.lanes.length; i++) {

            structureImage = this.add.image(x + 16 + (i * 33), y - 37 - (i * 33), 'structure-overhead');
            structureImage.setDepth(1000);
        }

        var poleFar = this.add.image(x + (this.lanes.length * 33), laneMarginTop - 44, 'structure-pole');
        poleFar.setDepth(999);
    },

    update: function () {

        const lane = this.lanes[Utils.getRandomInteger(0, this.lanes.length - 1)];
        if (lane && lane.hasRoomForNewCar()) {
            var car = this.cars.get();
            if (car) {
                const carTypes = this.carTypeLookup[lane.number];
                const carTypeIndex = Utils.getRandomInteger(0, carTypes.length - 1);
                car.onEntry(this.generateRandomLicensePlate(), lane, carTypes[carTypeIndex], Settings.trafficControlService);
            }
        }

        this.controls.update();

        if (this.cameras.main.zoom < 0.64) {
            this.cameras.main.zoom = 0.64;
        } else if (this.cameras.main.zoom > 1) {
            this.cameras.main.zoom = 1;
        }
    },

    createCarTypeLookup: function () {
        const carTypeLookup = [];
        for (let i = 0; i < this.lanes.length; i++) {
            carTypeLookup.push([]);
        }
        for (let carType of Settings.carTypes) {
            let lanes = carType.lanes ? carType.lanes : this.lanes.map(lane => lane.number);
            console.log(lanes);
            for (let laneNumber of lanes) {
                for (let i = 0; i < carType.selectionWeight; i++) {
                    carTypeLookup[laneNumber].push(carType);
                }
            }
        }
        return carTypeLookup;
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
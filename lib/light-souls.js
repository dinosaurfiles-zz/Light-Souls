function Game() {
    /* Global Objects */
    function multiplier(number, char) {
        var text = "";
        for (var i = 0; i < number; i++) {
            text += char + " ";
        }
        return text;
    }

    function initializeStats() {
        var lifeLabel = Q("UI.Text", 1).items[1];
        lifeLabel.p.label = 'Life: ' + multiplier(universalPlayer.p.life, "‍❤️‍");
        var powerLabel = Q("UI.Text", 1).items[2];
        powerLabel.p.label = 'Power: ' + multiplier(universalPlayer.p.currentAmmo, "‍۞");
        var keyLabel = Q("UI.Text", 1).items[3];
        keyLabel.p.label = 'Key: ' + multiplier(universalPlayer.p.hasKey, "‍");
    }

    var fireb = true;
    var damageC = true;
    var universalPlayer;

    /* Quintus Initial Objects */
    var Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Touch, UI")
        .setup({
            width: 960,
            height: 680,
            development: true
        }).controls().touch();

    //Player Object
    Q.Sprite.extend("Player", {
        init: function(p) {
            this._super(p, {
                x: 70,
                y: 420,
                asset: "wizard.png",
                jumpSpeed: -540,
                life: 3,
                currentAmmo: 5,
                currentLevel: 1,
                hasKey: false
            });

            this.add("2d, platformerControls");

            this.firebFunction = function() {
                fireb = true;
            }

            this.fire = function() {
                if (fireb) {
                    if (this.p.currentAmmo > 0) {
                        var tempX = 36;
                        var tempVX = 500;
                        var tempFlip = false;
                        if (this.p.direction == "left") {
                            tempX = -36;
                            tempVX = -500;
                            tempFlip = "x";
                        }
                        var bull = window.bull = new Q.Projectile({
                            w: 20,
                            h: 20,
                            x: this.p.x + tempX,
                            y: this.p.y,
                            vx: tempVX,
                            gravity: 0,
                            flip: tempFlip
                        });

                        Q.stage().insert(bull);

                        fireb = false;
                        this.p.currentAmmo--;
                        var powerLabel = Q("UI.Text", 1).items[2];
                        powerLabel.p.label = 'Power: ' + multiplier(this.p.currentAmmo, "۞");

                        setTimeout(this.firebFunction, 500);
                    }
                }
            }

            //Collision Options
            this.on("hit.sprite", function(collision) {
                if (collision.obj.isA("Key")) {
                    collision.obj.destroy();
                    this.p.hasKey = true;

                    //Update Labels
                    var keyLabel = Q("UI.Text", 1).items[3];
                    keyLabel.p.label = 'Key: ✔️';
                } else if (collision.obj.isA("Chest") && this.p.hasKey) {
                    universalPlayer.p.currentLevel++;

                    //Scene Selection if level is completed
                    if (universalPlayer.p.currentLevel > 3) {
                        Q.stageScene("endGame", 1, {
                            label: "Congratulations you saved the realms of the shadow!"
                        });
                    } else {
                        var nextLevel = "level" + universalPlayer.p.currentLevel;
                        Q.stageScene(nextLevel);
                    }
                } else if (collision.obj.isA("Orb")) {
                    collision.obj.destroy();
                    this.p.currentAmmo += 5;

                    //Update Labels
                    var powerLabel = Q("UI.Text", 1).items[2];
                    powerLabel.p.label = 'Power: ' + multiplier(this.p.currentAmmo, "۞");
                } else if (collision.obj.isA("Potion")) {
                    collision.obj.destroy();
                    this.p.life += 1;

                    //Update Labels
                    var lifeLabel = Q("UI.Text", 1).items[1];
                    lifeLabel.p.label = 'Life: ' + multiplier(this.p.life, "❤️‍");
                }
            });

            Q.input.on("fire", this, "fire");

        },
        damage: function() {
            this.damageCFunction = function() {
                damageC = true;
            }
            if (damageC) {
                damageC = false;
                this.p.life--;

                //Update Labels
                var lifeLabel = Q("UI.Text", 1).items[1];
                lifeLabel.p.label = 'Life: ' + multiplier(this.p.life, "‍❤️‍");

                if (this.p.life <= 0) {
                    this.destroy();
                    Q.stageScene("endGame", 1, {
                        label: "Game Over!"
                    });
                }

                setTimeout(this.damageCFunction, 250);
            }
        },
        step: function(dt) {
            if (Q.inputs["left"] && this.p.direction == "right") {
                this.p.flip = "x";
            }
            if (Q.inputs["right"] && this.p.direction == "left") {
                this.p.flip = false;
            }
        }
    });

    //Projectile Object
    Q.MovingSprite.extend("Projectile", {
        init: function(p) {
            this._super(p, {
                asset: "fireb.png",
            });
            this.add("2d");

            //This will make the Projectile travel in a horizontal line
            this.gravity = 0;
            this.on("hit", this.destroy);
        }
    });

    //Chest Object
    Q.Sprite.extend("Chest", {
        init: function(p) {
            this._super(p, {
                asset: "chest.png"
            });
            this.add("2d");
        }
    });

    //Key Object
    Q.Sprite.extend("Key", {
        init: function(p) {
            this._super(p, {
                asset: "key.png"
            });
            this.add("2d");
        }
    });

    //Orb Object
    Q.Sprite.extend("Orb", {
        init: function(p) {
            this._super(p, {
                asset: "orb.png",
            });
            this.add("2d");
        }
    });

    //Potion Object
    Q.Sprite.extend("Potion", {
        init: function(p) {
            this._super(p, {
                asset: "potion.png",
            });
            this.add("2d");
        }
    });

    //Enemy Super Class Object
    Q.component("enemySuperClass", {
        added: function() {
            var entity = this.entity;

            //Damage Player
            entity.on("bump.left,bump.right,bump.bottom", function(collision) {
                if (collision.obj.isA("Player")) {
                    collision.obj.damage();
                }
            });

            //Destroy enemy if jumped on top
            entity.on("bump.top", function(collision) {
                if (collision.obj.isA("Player")) {

                    //Make the player jump
                    collision.obj.p.vy = -100;
                    this.destroy();
                }
            });

            //Destroy if hitted by a Projectile
            entity.on("hit", function(collision) {
                if (collision.obj.isA("Projectile")) {
                    this.destroy();
                }
            });
        },
    });

    //GroundEnemy Object
    Q.Sprite.extend("GroundEnemy", {
        init: function(p) {
            this._super(p, {
                vx: -100,
                defaultDirection: "left"
            });
            this.add("2d, aiBounce, enemySuperClass");
        },
        step: function(dt) {
            var dirX = this.p.vx / Math.abs(this.p.vx);
            var ground = Q.stage().locate(this.p.x, this.p.y + this.p.h / 2 + 1, Q.SPRITE_DEFAULT);
            var nextTile = Q.stage().locate(this.p.x + dirX * this.p.w / 2 + dirX, this.p.y + this.p.h / 2 + 1, Q.SPRITE_DEFAULT);

            //Check if there's a ground on the next tile
            if (!nextTile && ground) {
                if (this.p.vx > 0) {
                    if (this.p.defaultDirection == "right") {
                        this.p.flip = "x";
                    } else {
                        this.p.flip = false;
                    }
                } else {
                    if (this.p.defaultDirection == "left") {
                        this.p.flip = "x";
                    } else {
                        this.p.flip = false;
                    }
                }
                this.p.vx = -this.p.vx;
            }
        }
    });

    //FlyingEnemy Object
    Q.Sprite.extend("FlyingEnemy", {
        init: function(p) {
            this._super(p, {
                vy: -100,
                rangeY: 200,
                gravity: 0
            });
            this.add("2d, enemySuperClass");

            this.p.initialY = this.p.y;
        },
        step: function(dt) {
            if (this.p.y - this.p.initialY >= this.p.rangeY && this.p.vy > 0) {
                this.p.vy = -this.p.vy;
            } else if (-this.p.y + this.p.initialY >= this.p.rangeY && this.p.vy < 0) {
                this.p.vy = -this.p.vy;
            }
        }
    });

    //Level 1
    Q.scene("level1", function(stage) {
        var background = new Q.TileLayer({
            dataAsset: "level1.tmx",
            layerIndex: 0,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_NONE
        });

        stage.insert(background);

        stage.collisionLayer(new Q.TileLayer({
            dataAsset: "level1.tmx",
            layerIndex: 1,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_DEFAULT
        }));

        var player = stage.insert(new Q.Player());
        universalPlayer = player;

        var levelAssets = [
            ["GroundEnemy", {
                x: 16 * 70,
                y: 6 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 25 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 30 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 34 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 28 * 70,
                y: 5 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 31 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["FlyingEnemy", {
                x: 8 * 70,
                y: 7 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["Key", {
                x: 18.5 * 70,
                y: 1 * 70,
                asset: "key.png"
            }],
            ["Chest", {
                x: 39 * 70,
                y: 1 * 70,
                asset: "chest.png"
            }]
        ];

        stage.loadAssets(levelAssets);

        stage.add("viewport").follow(player, {
            x: true,
            y: true
        }, {
            minX: 0,
            maxX: background.p.w,
            minY: 0,
            maxY: background.p.h
        });
    });

    //Level2
    Q.scene("level2", function(stage) {
        var levelLabel = Q("UI.Text", 1).items[0];
        levelLabel.p.label = 'Level: 2';

        initializeStats();

        var background = new Q.TileLayer({
            dataAsset: "level2.tmx",
            layerIndex: 0,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_NONE
        });

        stage.insert(background);

        stage.collisionLayer(new Q.TileLayer({
            dataAsset: "level2.tmx",
            layerIndex: 1,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_DEFAULT
        }));

        var player = stage.insert(new Q.Player);
        player.p.currentAmmo = universalPlayer.p.currentAmmo;
        player.p.life = universalPlayer.p.life;

        var levelAssets = [
            ["GroundEnemy", {
                x: 6 * 70,
                y: 13 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 14 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 19 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 25 * 70,
                y: 13 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 29 * 70,
                y: 12 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 34 * 70,
                y: 12 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 34 * 70,
                y: 7 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 36 * 70,
                y: 7 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 25 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 31 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 27 * 70,
                y: 6 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 32 * 70,
                y: 6 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 18 * 70,
                y: 1 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 26 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 28 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 30 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 35 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["FlyingEnemy", {
                x: 19 * 70,
                y: 5 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 13 * 70,
                y: 2 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 25 * 70,
                y: 12 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 26 * 70,
                y: 11 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["Orb", {
                x: 31.5 * 70,
                y: 10 * 70,
                asset: "orb.png"
            }],
            ["Orb", {
                x: 12.5 * 70,
                y: 12 * 70,
                asset: "orb.png"
            }],
            ["Orb", {
                x: 38.5 * 70,
                y: 2 * 70,
                asset: "orb.png"
            }],
            ["Key", {
                x: 1.5 * 70,
                y: 2 * 70,
                asset: "key.png"
            }],
            ["Chest", {
                x: 38 * 70,
                y: 3 * 70,
                asset: "chest.png"
            }]
        ];

        stage.loadAssets(levelAssets);

        stage.add("viewport").follow(player, {
            x: true,
            y: true
        }, {
            minX: 0,
            maxX: background.p.w,
            minY: 0,
            maxY: background.p.h
        });
    });

    //level 3
    Q.scene("level3", function(stage) {
        var levelLabel = Q("UI.Text", 1).items[0];
        levelLabel.p.label = 'Level: 3';

        initializeStats();

        var background = new Q.TileLayer({
            dataAsset: "level3.tmx",
            layerIndex: 0,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_NONE
        });

        stage.insert(background);

        stage.collisionLayer(new Q.TileLayer({
            dataAsset: "level3.tmx",
            layerIndex: 1,
            sheet: "tiles",
            tileW: 70,
            tileH: 70,
            type: Q.SPRITE_DEFAULT
        }));

        var player = stage.insert(new Q.Player);
        player.p.currentAmmo = universalPlayer.p.currentAmmo;
        player.p.life = universalPlayer.p.life;

        var levelAssets = [
            ["GroundEnemy", {
                x: 11 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 13 * 70,
                y: 1 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 12 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 14 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 18 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 36 * 70,
                y: 7 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 25 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 31 * 70,
                y: 8 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 27 * 70,
                y: 6 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 32 * 70,
                y: 6 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 18 * 70,
                y: 1 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 26 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 28 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 30 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 35 * 70,
                y: 3 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 10 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 12 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 14 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 11 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 1 * 70,
                y: 22 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 10 * 70,
                y: 21 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 20 * 70,
                y: 20 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 22 * 70,
                y: 19 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 2 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 4 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 6 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 8 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 3 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 5 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 7 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 9 * 70,
                y: 28 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 14 * 70,
                y: 15 * 70,
                asset: "groundenemy.png"
            }],
            ["GroundEnemy", {
                x: 16 * 70,
                y: 15 * 70,
                asset: "groundenemy.png"
            }],
            ["FlyingEnemy", {
                x: 19 * 70,
                y: 15 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 21 * 70,
                y: 16 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 3 * 70,
                y: 27 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 20 * 70,
                y: 24 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["FlyingEnemy", {
                x: 22 * 70,
                y: 24 * 70,
                rangeY: .5 * 70,
                asset: "flyingenemy.png"
            }],
            ["Orb", {
                x: 23.5 * 70,
                y: 26 * 70,
                asset: "orb.png"
            }],
            ["Orb", {
                x: 9.5 * 70,
                y: 3 * 70,
                asset: "orb.png"
            }],
            ["Key", {
                x: 4.5 * 70,
                y: 1 * 70,
                asset: "key.png"
            }],
            ["Chest", {
                x: 24 * 70,
                y: 3 * 70,
                asset: "chest.png"
            }]
        ];

        stage.loadAssets(levelAssets);

        stage.add("viewport").follow(player, {
            x: true,
            y: true
        }, {
            minX: 0,
            maxX: background.p.w,
            minY: 0,
            maxY: background.p.h
        });
    });

    //Endgame Scene
    Q.scene('endGame', function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: Q.width / 2,
            y: Q.height / 2,
            fill: "rgba(0,0,0,0.5)"
        }));

        var button = container.insert(new Q.UI.Button({
            x: 0,
            y: 0,
            fill: "#CCCCCC",
            label: "Play Again"
        }))
        var label = container.insert(new Q.UI.Text({
            x: 10,
            y: -10 - button.p.h,
            label: stage.options.label
        }));
        // When the button is clicked, clear all the stages
        // and restart the game.
        button.on("click", function() {
            Q.clearStages();
            new Game();
        });

        // Expand the container to visibily fit it's contents
        container.fit(20);
    });

    //GameStats/GameLabel
    Q.scene("gameStats", function(stage) {
        var statsContainer = stage.insert(new Q.UI.Container({
            fill: "gray",
            x: 960 / 2,
            y: 655,
            border: 1,
            shadow: 3,
            shadowColor: "rgba(0,0,0,0.5)",
            w: 960,
            h: 40
        }));

        var level = stage.insert(new Q.UI.Text({
            label: "Level: 1",
            color: "white",
            x: -400,
            y: 0
        }), statsContainer);

        var life = stage.insert(new Q.UI.Text({
            label: "Life: ❤️‍ ❤️ ‍❤️‍",
            color: "white",
            x: -240,
            y: 0
        }), statsContainer);

        var power = stage.insert(new Q.UI.Text({
            label: "Power: ۞ ۞ ۞‍ ۞‍ ۞‍",
            color: "white",
            x: 20,
            y: 0
        }), statsContainer);

        var key = stage.insert(new Q.UI.Text({
            label: "Key: ",
            color: "white",
            x: 260,
            y: 0
        }), statsContainer);
    });

    //Load all assets plus initial level
    Q.load("tiles.png, origin.tmx, level1.tmx, level2.tmx, level3.tmx, wizard.png, fireb.png, orb.png, potion.png, key.png, chest.png, groundenemy.png, flyingenemy.png", function() {
        Q.sheet("tiles", "tiles.png", {
            tilew: 70,
            tileh: 70
        });
        Q.stageScene("level1");
        Q.stageScene("gameStats", 1);
    });
}

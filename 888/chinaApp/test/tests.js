
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'provider1': {
                cname: 'www.provider1.net'
            },
            'provider2': {
                cname: 'www.provider2.net'
            },
            'provider3': {
                cname: 'www.provider3.net'
            }
        },

        country_override: {
            //the properties "provider", "failover_provider" must be defined on every 'country_override' config
            'CN': {
                //this list of provider aliases should be defined on provider settings ^^^ , if not, the app will throw fallback
                providers: ['provider1', 'provider2'], //this list is ordered by the importance of the providers, the app first will check if 'provider1`is available, if not will check for 'provider2' and so on
                failover_provider: 'provider3'
            }
        },

        //used for rest of the world
        default_override: {
            providers: ['provider2'],
            failover_provider: 'provider3'
        },

        default_ttl: 20,
        availability_threshold: 90,
        // flip to true if the platform will be considered unavailable if it does not have sonar data
        require_sonar_data: true,
        //Set Fusion Sonar threshold for availability for the platform to be included.
        // sonar values are between 0 - 5
        fusion_sonar_threshold: 2
    };

    module('do_init');

    function test_do_init(i) {
        return function() {

            var sut = new OpenmixApplication(i.settings || default_settings),
                config = {
                    requireProvider: this.stub()
                },
                test_stuff = {
                    instance: sut,
                    config: config
                };

            i.setup(test_stuff);

            // Test
            sut.do_init(config);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('default', test_do_init({
        setup: function() { return; },
        verify: function(i) {
            equal(i.config.requireProvider.callCount, 3, 'Verifying requireProvider call count');
            equal(i.config.requireProvider.args[2][0], 'provider1', 'Verirying provider alias');
            equal(i.config.requireProvider.args[1][0], 'provider2', 'Verirying provider alias');
            equal(i.config.requireProvider.args[0][0], 'provider3', 'Verirying provider alias');
        }
    }));

    module('handle_request');

    function test_handle_request(i) {
        return function() {
            var sut = new OpenmixApplication(i.settings || default_settings),
                request = {
                    getProbe: this.stub(),
                    getData: this.stub()
                },
                response = {
                    respond: this.stub(),
                    setTTL: this.stub(),
                    setReasonCode: this.stub()
                },
                test_stuff = {
                    instance: sut,
                    request: request,
                    response: response
                };

            this.stub(Math, 'random');

            i.setup(test_stuff);

            // Test
            sut.handle_request(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('country_override_best_provider_available_1', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 100
                    },
                    "provider2": {
                        "avail": 95
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider1', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider1.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('country_override_best_provider_available_2', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 70
                    },
                    "provider2": {
                        "avail": 95
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider2', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider2.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('country_override_failover_provider', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 60
                    },
                    "provider2": {
                        "avail": 70
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('country_override_failover_provider_2', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 60
                    },
                    "provider2": {
                        "avail": 99
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 0
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));


    test('default_override_best_provider_available', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 99
                    },
                    "provider2": {
                        "avail": 95
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'AR';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider2', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider2.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'C', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('default_override_failover_provider', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 99
                    },
                    "provider2": {
                        "avail": 70
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'D', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('data_problem-country_override_failover_provider', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({});
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'E,B', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('data_problem-country_override_failover_provider_2', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 60
                    },
                    "provider2": {
                        "avail": 70
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({});
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'E,B', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('data_problem-default_override_failover_provider', test_handle_request({
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({});
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "provider1": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider2": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "provider3": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    })
                });
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider3', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider3.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'E,D', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));

    test('country_override_best_provider_available-no_fusion_data-require_sonar_false', test_handle_request({
        settings: {
            providers: {
                'provider1': {
                    cname: 'www.provider1.net'
                },
                'provider2': {
                    cname: 'www.provider2.net'
                },
                'provider3': {
                    cname: 'www.provider3.net'
                }
            },

            country_override: {
                //the properties "provider", "failover_provider" must be defined on every 'country_override' config
                'CN': {
                    //this list of provider aliases should be defined on provider settings ^^^ , if not, the app will throw fallback
                    providers: ['provider1', 'provider2'], //this list is ordered by the importance of the providers, the app first will check if 'provider1`is available, if not will check for 'provider2' and so on
                    failover_provider: 'provider3'
                }
            },

            //used for rest of the world
            default_override: {
                providers: ['provider2'],
                failover_provider: 'provider3'
            },

            default_ttl: 20,
            availability_threshold: 90,
            // flip to true if the platform will be considered unavailable if it does not have sonar data
            require_sonar_data: false,
            //Set Fusion Sonar threshold for availability for the platform to be included.
            // sonar values are between 0 - 5
            fusion_sonar_threshold: 2
        },
        setup: function(i) {
            i.request
                .getProbe
                .withArgs('avail')
                .returns({
                    "provider1": {
                        "avail": 70
                    },
                    "provider2": {
                        "avail": 95
                    },
                    "provider3": {
                        "avail": 100
                    }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({});
            i.request.country = 'CN';
        },
        verify: function(i) {
            equal(i.request.getProbe.callCount, 1, 'Verifying getProbe call count');
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'provider2', 'Verifying respond provider');
            equal(i.response.respond.args[0][1], 'www.provider2.net', 'Verifying respond CNAME');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying setReasonCode');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying setTTL');
        }
    }));



}());

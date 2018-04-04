
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'edgecast__small': {
                cname: 'wac.B890.edgecastcdn.net'
            },
            'highwinds': {
                cname: 'cds.u8a8j4j6.hwcdn.net'
            },
            'leaseweb_cdn': {
                cname: 'abc40befd1ae6f7e1702cafa8b6350e4.lswcdn.net'
            },
            'maxcdn': {
                cname: 'abtasty.abtasty.netdna-cdn.com'
            }
            /*,'cloudflare': {
             cname: 'liw.io'
             },
             'cloudfront': {
             cname: 'd1447tq2m68ekg.cloudfront.net'
             }*/
        },

        // The TTL to be set when the application chooses a geo provider.
        default_ttl: 20,
        availability_threshold: 90,
        //Set RAX Sonar threshold for availability for the platform to be included.
        // sonar values are between 0 - 5
        rax_sonar_threshold: 2
    };

    module('do_init');

    function test_do_init(i) {
        return function() {
            var sut,
                config = {
                    requireProvider: this.stub()
                },
                test_stuff = {
                    config: config
                };
            i.setup(test_stuff);
            sut = new OpenmixApplication(i.settings || default_settings);
            // Test
            sut.do_init(config);
            // Assert
            i.verify(test_stuff);
        };
    }

    test('default', test_do_init({
        setup: function() {
            return;
        },
        verify: function(i) {
            equal(i.config.requireProvider.callCount, 4);
            equal(i.config.requireProvider.args[3][0], 'edgecast__small');
            equal(i.config.requireProvider.args[2][0], 'highwinds');
            equal(i.config.requireProvider.args[1][0], 'leaseweb_cdn');
            equal(i.config.requireProvider.args[0][0], 'maxcdn');
        }
    }));

    module('handle_request');

    function test_handle_request(i) {
        return function() {
            var sut,
                config = {
                    requireProvider: this.stub()
                },
                request = {
                    getProbe: this.stub(),
                    getData: this.stub()
                },
                response = {
                    respond: this.stub(),
                    setTTL: this.stub(),
                    setReasonCode: this.stub()
                },
                test_stuff;

            sut = new OpenmixApplication(i.settings || default_settings);
            sut.do_init(config);

            test_stuff = {
                request: request,
                response: response,
                sut: sut
            };

            this.stub(Math, 'random');

            i.setup(test_stuff);

            // Test
            sut.handle_request(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('best_performing_provider', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast__small': { avail: 100 },
                    'highwinds': { avail: 85 },
                    'leaseweb_cdn': { avail: 100 },
                    'maxcdn': { avail: 75 }
            });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast__small': { http_rtt: 60 },
                    'highwinds': { http_rtt: 85 },
                    'leaseweb_cdn': { http_rtt: 90 },
                    'maxcdn': { http_rtt: 75 }
            });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "edgecast__small": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "highwinds": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "leaseweb_cdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "maxcdn": JSON.stringify({
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
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'edgecast__small', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'wac.B890.edgecastcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('best_performing_provider_no_fusion', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast__small': { avail: 70 },
                    'highwinds': { avail: 85 },
                    'leaseweb_cdn': { avail: 100 },
                    'maxcdn': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast__small': { http_rtt: 60 },
                    'highwinds': { http_rtt: 85 },
                    'leaseweb_cdn': { http_rtt: 90 },
                    'maxcdn': { http_rtt: 75 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({});
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'leaseweb_cdn', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'abc40befd1ae6f7e1702cafa8b6350e4.lswcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('best_performing_provider_BRB_case', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast__small': { avail: 70 },
                    'highwinds': { avail: 85 },
                    'leaseweb_cdn': { avail: 80 },
                    'maxcdn': { avail: 100 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast__small': { http_rtt: 60 },
                    'highwinds': { http_rtt: 85 },
                    'leaseweb_cdn': { http_rtt: 90 },
                    'maxcdn': { http_rtt: 75 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "edgecast__small": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true,
                        "availability_override": true
                    }),
                    "highwinds": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true,
                        "availability_override": true
                    }),
                    "leaseweb_cdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true,
                        "availability_override": true
                    }),
                    "maxcdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 0
                        },
                        "bypass_data_points": true,
                        "availability_override": true
                    })
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'maxcdn', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'abtasty.abtasty.netdna-cdn.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('all_providers_eliminated', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast__small': { avail: 80 },
                    'highwinds': { avail: 85 },
                    'leaseweb_cdn': { avail: 100 },
                    'maxcdn': { avail: 99 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast__small': { http_rtt: 60 },
                    'highwinds': { http_rtt: 85 },
                    'leaseweb_cdn': { http_rtt: 90 },
                    'maxcdn': { http_rtt: 75 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "edgecast__small": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "highwinds": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "leaseweb_cdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 1
                        },
                        "bypass_data_points": true
                    }),
                    "maxcdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 2
                        },
                        "bypass_data_points": true
                    })
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'leaseweb_cdn', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'abc40befd1ae6f7e1702cafa8b6350e4.lswcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'C', 'Verifying reason code');
        }
    }));

    test('data_problem_rtt', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast__small': { avail: 80 },
                    'highwinds': { avail: 85 },
                    'leaseweb_cdn': { avail: 100 },
                    'maxcdn': { avail: 99 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({});
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "edgecast__small": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "highwinds": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "leaseweb_cdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 1
                        },
                        "bypass_data_points": true
                    }),
                    "maxcdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 1
                        },
                        "bypass_data_points": true
                    })
                });
            Math.random.returns(0.99);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'maxcdn', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'abtasty.abtasty.netdna-cdn.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('data_problem_avail', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({});
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast__small': { http_rtt: 60 },
                    'highwinds': { http_rtt: 85 },
                    'leaseweb_cdn': { http_rtt: 90 },
                    'maxcdn': { http_rtt: 75 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "edgecast__small": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "highwinds": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 5
                        },
                        "bypass_data_points": true
                    }),
                    "leaseweb_cdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 1
                        },
                        "bypass_data_points": true
                    }),
                    "maxcdn": JSON.stringify({
                        "status": "HTTP server is functioning normally",
                        "state": "OK",
                        "health_score": {
                            "unit": "0-5",
                            "value": 2
                        },
                        "bypass_data_points": true
                    })
                });
            Math.random.returns(0.99);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'maxcdn', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'abtasty.abtasty.netdna-cdn.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

}());

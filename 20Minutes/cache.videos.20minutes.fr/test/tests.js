
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'level3': {
                cname:'cache.videos.20minutes.fr.c.footprint.net'
            },
            'edgecast_large': {
                cname: 'wpc.6497.edgecastcdn.net'
            }
        },

        // The TTL to be set when the application chooses a geo provider.
        default_ttl: 20,
        availability_threshold: 90,
        tie_threshold: 0.95
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
            equal(i.config.requireProvider.callCount, 2);
            equal(i.config.requireProvider.args[1][0], 'level3');
            equal(i.config.requireProvider.args[0][0], 'edgecast_large');
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

    test('test 1 -best_performing_by_kbps', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'level3': { avail: 100 },
                    'edgecast_large': { avail: 95 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'level3': { http_rtt: 60 },
                    'edgecast_large': { http_rtt: 85 }
            });
            i.request
                .getProbe
                .onCall(2)
                .returns({
                    'level3': { http_kbps: 150 },
                    'edgecast_large': { http_kbps: 100 }
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.videos.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));


    test('test 2 -best_performing_by_rtt_kbps_tie', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'level3': { avail: 100 },
                    'edgecast_large': { avail: 95 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'level3': { http_rtt: 90 },
                    'edgecast_large': { http_rtt: 85 }
                });
            i.request
                .getProbe
                .onCall(2)
                .returns({
                    'level3': { http_kbps: 101 },
                    'edgecast_large': { http_kbps: 100 }
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'edgecast_large', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'wpc.6497.edgecastcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('test 3 -best_performing_by_rtt_no_kbps_data', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'level3': { avail: 100 },
                    'edgecast_large': { avail: 95 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'level3': { http_rtt: 60 },
                    'edgecast_large': { http_rtt: 85 }
                });
            i.request
                .getProbe
                .onCall(2)
                .returns({});
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.videos.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('test 4 -data_problem', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'level3': { avail: 100 },
                    'edgecast_large': { avail: 95 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({});
            i.request
                .getProbe
                .onCall(2)
                .returns({});
            Math.random.returns(0.1);
        },

        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.videos.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'C', 'Verifying reason code');
        }
    }));

    test('test 5 -best_all_providers_eliminated', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'level3': { avail: 70 },
                    'edgecast_large': { avail: 60 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'level3': { http_rtt: 60 },
                    'edgecast_large': { http_rtt: 85 }
                });
            i.request
                .getProbe
                .onCall(2)
                .returns({
                    'level3': { http_kbps: 101 },
                    'edgecast_large': { http_kbps: 100 }
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.videos.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'D', 'Verifying reason code');
        }
    }));

}());

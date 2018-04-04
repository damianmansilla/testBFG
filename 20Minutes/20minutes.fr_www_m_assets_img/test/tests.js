
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'edgecast': { 'cname': 'wac.6497.edgecastcdn.net', 'padding': 0, 'penal': false },
            'ovh-1': { 'cname': '5.135.137.172', 'padding': 0, 'penal': true, 'surpenal': -15 },
            'online-1': { 'cname': '163.172.15.235', 'padding': 0, 'penal': true, 'surpenal': -15 }
        },
        asn_override: {
            15169: 'edgecast'
        },
        availability_threshold: 90,
        max_delta: 70,
        security_threshold: 100,
        default_ttl: 20,
        random_threshold: 5
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
            equal(i.config.requireProvider.callCount, 3);
            equal(i.config.requireProvider.args[2][0], 'online-1');
            equal(i.config.requireProvider.args[1][0], 'ovh-1');
            equal(i.config.requireProvider.args[0][0], 'edgecast');
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

    test('test 1 -best_performing', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast': { avail: 100 },
                    'ovh-1': { avail: 95 },
                    'online-1': { avail: 100 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast': { http_rtt: 90 },
                    'ovh-1': { http_rtt: 85 },
                    'online-1': { http_rtt: 100 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "ovh-1": "100\n",
                    "online-1": "100\n"
                });
            Math.random.returns(0.5);
            i.request.asn = 1234;
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'ovh-1', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], '5.135.137.172', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('test 2 -data_problem', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast': { avail: 50 },
                    'ovh-1': { avail: 50 },
                    'online-1': { avail: 50 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast': { http_rtt: 90 },
                    'ovh-1': { http_rtt: 85 },
                    'online-1': { http_rtt: 100 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "ovh-1": "100\n",
                    "online-1": "100\n"
                });
            Math.random.returns(0.1);
            i.request.asn = 1234;
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'edgecast', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'wac.6497.edgecastcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('test 3 -asn_override', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'edgecast': { avail: 100 },
                    'ovh-1': { avail: 95 },
                    'online-1': { avail: 100 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'edgecast': { http_rtt: 90 },
                    'ovh-1': { http_rtt: 85 },
                    'online-1': { http_rtt: 100 }
                });
            i.request
                .getData
                .withArgs('fusion')
                .returns({
                    "ovh-1": "100\n",
                    "online-1": "100\n"
                });
            Math.random.returns(0.5);
            i.request.asn = 15169;
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'edgecast', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'wac.6497.edgecastcdn.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'C', 'Verifying reason code');
        }
    }));

}());

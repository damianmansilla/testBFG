
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'cdn1_abtasty': {
                cname: 'cdn1.abtasty.com',
                roundrobin: true,
                handicap: 0
            },
            'cdn2_abtasty': {
                cname: 'cdn2.abtasty.com',
                roundrobin: true,
                handicap: 0
            },
            'cdn3_abtasty': {
                cname: 'cdn3.abtasty.com',
                roundrobin: true,
                handicap: 0
            },
            'cdn4_abtasty': {
                cname: 'cdn4.abtasty.com',
                roundrobin: true,
                handicap: 0
            },
            'cdn5_abtasty': {
                cname: 'cdn5.abtasty.com',
                roundrobin: true,
                handicap: 0
            },
            'cloudflare_private': {
                cname: 'code.abtasty.com.cdn.cloudflare.net',
                roundrobin: false,
                handicap: 0
            },
            'cloudfront_private': {
                cname: 'd1bpdvqzr2w2i4.cloudfront.net',
                roundrobin: false,
                handicap: 10
            }
        },
        country_handicap_override: {
            'AR': {
                'cdn1_abtasty': 5,
                'cdn10_abtasty': 10,
                'cdn8_abtasty': 50
            }
        },
        default_provider: 'cloudfront_private',
        default_ttl: 25,
        min_valid_rtt_score: 7,
        need_avail_data: true,
        need_rtt_data: true,
        avail_threshold: 90
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
            equal(i.config.requireProvider.callCount, 7);
            equal(i.config.requireProvider.args[6][0], 'cdn1_abtasty');
            equal(i.config.requireProvider.args[5][0], 'cdn2_abtasty');
            equal(i.config.requireProvider.args[4][0], 'cdn3_abtasty');
            equal(i.config.requireProvider.args[3][0], 'cdn4_abtasty');
            equal(i.config.requireProvider.args[2][0], 'cdn5_abtasty');
            equal(i.config.requireProvider.args[1][0], 'cloudflare_private');
            equal(i.config.requireProvider.args[0][0], 'cloudfront_private');
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

    test('test 1 one_acceptable_provider', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 10 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 10 },
                    'cdn4_abtasty': { avail: 100 },
                    'cdn5_abtasty': { avail: 10 },
                    'cloudflare_private': { avail: 10 },
                    'cloudfront_private': { avail: 75 }
            });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
            });
            i.request.country = 'XX';
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cdn4_abtasty', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cdn4.abtasty.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('test 2 best_provider_selected', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 100 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 100 },
                    'cdn4_abtasty': { avail: 100 },
                    'cdn5_abtasty': { avail: 100 },
                    'cloudflare_private': { avail: 100 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'XX';
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cdn1_abtasty', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cdn1.abtasty.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('test 2.5 best_provider_selected handicap override', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 100 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 100 },
                    'cdn4_abtasty': { avail: 100 },
                    'cdn5_abtasty': { avail: 100 },
                    'cloudflare_private': { avail: 100 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'AR';
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cloudflare_private', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'code.abtasty.com.cdn.cloudflare.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

    test('test 3 no_available_providers', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 10 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 10 },
                    'cdn4_abtasty': { avail: 10 },
                    'cdn5_abtasty': { avail: 10 },
                    'cloudflare_private': { avail: 10 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'XX';
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cloudfront_private', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'd1bpdvqzr2w2i4.cloudfront.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'CD', 'Verifying reason code');
        }
    }));

    test('test 4 fr_no_available_providers', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 10 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 10 },
                    'cdn4_abtasty': { avail: 10 },
                    'cdn5_abtasty': { avail: 10 },
                    'cloudflare_private': { avail: 100 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 0 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'FR';
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cloudflare_private', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'code.abtasty.com.cdn.cloudflare.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'E', 'Verifying reason code');
        }
    }));

    test('test 5 fr_rr', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 100 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 100 },
                    'cdn4_abtasty': { avail: 100 },
                    'cdn5_abtasty': { avail: 100 },
                    'cloudflare_private': { avail: 100 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'FR';
            Math.random.returns(0.99);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cdn5_abtasty', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cdn5.abtasty.com', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'F', 'Verifying reason code');
        }
    }));

    test('test 6 fr_failovercdn', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'cdn1_abtasty': { avail: 10 },
                    'cdn2_abtasty': { avail: 85 },
                    'cdn3_abtasty': { avail: 10 },
                    'cdn4_abtasty': { avail: 10 },
                    'cdn5_abtasty': { avail: 10 },
                    'cloudflare_private': { avail: 100 },
                    'cloudfront_private': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'cdn1_abtasty': { http_rtt: 60 },
                    'cdn2_abtasty': { http_rtt: 85 },
                    'cdn3_abtasty': { http_rtt: 90 },
                    'cdn4_abtasty': { http_rtt: 90 },
                    'cdn5_abtasty': { http_rtt: 90 },
                    'cloudflare_private': { http_rtt: 90 },
                    'cloudfront_private': { http_rtt: 75 }
                });
            i.request.country = 'FR';
            Math.random.returns(0.99);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'cloudflare_private', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'code.abtasty.com.cdn.cloudflare.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 25, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'G', 'Verifying reason code');
        }
    }));

}());

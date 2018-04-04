
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'foo': {
                cname: 'www.foo.com', 
                availabilityType :'radar',
    		    weight : 1,
    		    usage : 0,
    		    commit : Number.MAX_VALUE,
    		    bandwidth : 0,
    		    max_bandwidth : Number.MAX_VALUE
            },
            'bar': {
                cname: 'www.bar.com', 
                availabilityType :'radar',
    		    weight : 1,
    		    usage : 0,
    		    commit : Number.MAX_VALUE,
    		    bandwidth : 0,
    		    max_bandwidth : Number.MAX_VALUE
            }
        },
        default_provider: 'foo',
        default_ttl: 20,
        radar_availability_threshold : 90,
        fusion_feed : 'tv1',
        fusion_cdns_key : 'cdns',
        	
    	config: {
    		mode : 'WEIGHT_ONLY',
    		default_provider: 'akamai',
    		default_ttl: 120,
    		radar_availability_threshold : 90
    	} 
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
            equal(1, 1, 'dummy');
        }
    }));

    module('handle_request');

    function test_handle_request(i) {
        return function() {
            var sut = new OpenmixApplication(i.settings || default_settings),
                request = {
                    getData: this.stub(),
                    getProbe: this.stub()
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
            
            i.setup(test_stuff);

            // Test
            sut.handle_request(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('test 1', test_handle_request({
        setup: function(i) {
        	i.request.getProbe.withArgs('avail').returns({
                'foo': { 'avail': 99 },
                'bar': { 'avail': 98 }
            });
        	i.request.getData.withArgs('fusion').returns({
                "tv1": JSON.stringify(
                		{  
                			  "cdns":[  
                			    {  
                			      "name":"foo",
                			      "usage":124,
                			      "commit":500000,
                			      "update":"2017-05-15T13:09:45+00:00"
                			    },
                			    {  
                			      "name":"bar",
                			      "usage":456,
                			      "commit":200000,
                			      "update":"2017-05-15T13:50:45+00:00"
                			    }
                			  ]
                			
                })
            });
        },
        verify: function(i) {

        	 equal(1, 1, 'dummy');

        }
    }));

    test('test 2', test_handle_request({
        setup: function(i) {
        	i.request.getProbe.withArgs('avail').returns({
                'foo': { 'avail': 99 },
                'bar': { 'avail': 98 }
            });
        	i.request.getData.withArgs('fusion').returns({
                "tv1": JSON.stringify(
                		{  
                			  "cdns":[  
                			    {  
                			      "name":"foo",
                			      "usage":124,
                			      "commit":500000,
                			      "update":"2017-05-15T13:09:45+00:00"
                			    },
                			    {  
                			      "name":"bar",
                			      "usage":456,
                			      "commit":200000,
                			      "update":"2017-05-15T13:50:45+00:00"
                			    }
                			  ]
                			
                })
            });
        },
        verify: function(i) {
        	 equal(1, 1, 'dummy');
         

        }
    }));

    test('test 3', test_handle_request({
        setup: function(i) {
        	i.request.getProbe.withArgs('avail').returns({
                'foo': { 'avail': 99 }
            });
        	i.request.getData.withArgs('fusion').returns({
                "tv1": JSON.stringify(
                		{  
                			  "cdns":[  
                			    {  
                			      "name":"foo",
                			      "usage":124,
                			      "commit":500000,
                			      "update":"2017-05-15T13:09:45+00:00"
                			    },
                			    {  
                			      "name":"bar",
                			      "usage":456,
                			      "commit":200000,
                			      "update":"2017-05-15T13:50:45+00:00"
                			    }
                			  ]
                			
                })
            });
        },
        verify: function(i) {

        	 equal(1, 1, 'dummy');
        }
    }));

    test('test 4', test_handle_request({
        setup: function(i) {
        	i.request.getProbe.withArgs('avail').returns({
                'foo': { 'avail': 99 }
            });
        	i.request.getData.withArgs('fusion').returns({
                "tv1": JSON.stringify(
                		{  
                			  "cdns":[  
                			    {  
                			      "name":"foo",
                			      "usage":124,
                			      "commit":500000,
                			      "update":"2017-05-15T13:09:45+00:00"
                			    },
                			    {  
                			      "name":"bar",
                			      "usage":456,
                			      "commit":200000,
                			      "update":"2017-05-15T13:50:45+00:00"
                			    }
                			  ]
                			
                })
            });
        },
        verify: function(i) {

            equal(1, 1, 'dummy');

        }
    }));
    
    test('test 5', test_handle_request({
        setup: function(i) {
        	i.request.getProbe.withArgs('avail').returns({
                'foo': { 'avail': 99 },
                'bar': { 'avail': 99 }
            });
        	i.request.getData.withArgs('fusion').returns({
                "tv1": JSON.stringify(
                		{  
                			  "cdns":[  
                			    {  
                			      "name":"foo",
                			      "usage":124,
                			      "commit":500000,
                			      "update":"2017-05-15T13:09:45+00:00",
                			      "weight" : "30"
                			    },
                			    {  
                			      "name":"bar",
                			      "usage":456,
                			      "commit":200000,
                			      "update":"2017-05-15T13:50:45+00:00",
                			      "weight" : "32"
                			    }
                			  ]
                			
                })
            });
        },
        verify: function(i) {

            equal(1, 1, 'dummy');

        }
    }));


}());

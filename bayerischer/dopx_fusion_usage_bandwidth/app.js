var handler = new OpenmixApplication({
    // `providers` contains a list of the providers to be load-balanced
    // `alias` is the Openmix alias set in the Portal
    // `cname` is the CNAME or IP address to be sent as the answer when this provider is selected
	// availabilityType indicates if the availability comes from radar or sonar
	// weight is the weigth for the CDN. smaller is the weight, less the CDN will be chosen. Higher is the weight, more often the CDN will be chosen
	// usage : current usage of data from the beginning of the period
	// commit : maximum amount of data we should not exceed
	// bandwidth : current bandwidth used in the CDN
	// max_bandwidth : maximum bandwidth we should not exceed
	// note that all the values can be override with the fusion feed. The matching is done on the name field from the fusion json feed (ex : "name":"akamai" will match the 'akamai' provider)
	providers: {  
	   'akamai': {
		    cname:'multicdnak1.br.de.edgesuite.net',
		    availabilityType :'radar',
		    weight : 4,
		    usage : 0,
		    commit : Number.MAX_VALUE,
		    bandwidth : 0,
		    max_bandwidth : Number.MAX_VALUE
		  },
	  'level3' : {  
		    cname :'multicdnlevel3.br.de.c.footprint.net',
		    availabilityType:'radar',
		    weight : 2,
		    usage : 0,
		    commit : Number.MAX_VALUE,
		    bandwidth : 0,
		    max_bandwidth : Number.MAX_VALUE
		  },
	  'tv1' : {  
		    cname :'46.18.240.202',
		    availabilityType :'sonar',
		    weight : 3,
		    usage : 0,
		    commit : Number.MAX_VALUE,
		    bandwidth : 0,
		    max_bandwidth : Number.MAX_VALUE
		  }
    },

    
    fusion_feed : 'tv1',
    fusion_cdns_key : 'cdns',
	fusion_config_key : 'config',
	modes : ['WEIGHT_ONLY','WEIGHT_AND_USAGE'],
	
    // `config` contains a list of the parameters
	// note that all the values can be override with the fusion feed, under the object under fusion_config_key ('config')
	config: {
		mode : 'WEIGHT_ONLY',
		default_provider: 'akamai',
		default_ttl: 120,
		radar_availability_threshold : 90
	} 
});

function init(config) {
    'use strict';
    handler.do_init(config);
}

function onRequest(request, response) {
    'use strict';
    handler.handle_request(request, response);
}

/** @constructor */
function OpenmixApplication(settings) {
    'use strict';

    var aliases = settings.providers === undefined ? [] : Object.keys(settings.providers);

    /**
     * @param {OpenmixConfiguration} config
     */
    this.do_init = function(config) {
        var i = aliases.length;

        while (i --) {
            config.requireProvider(aliases[i]);
        }
    };

    /**
     * @param {OpenmixRequest} request
     * @param {OpenmixResponse} response
     */
    this.handle_request = function(request, response) {
        var allReasons = {
        		default_provider_after_availability_filter : 'A',
                default_provider_after_bandwidth_filter : 'B',
        		only_one_remaining_after_filters: 'O',
                weighted_round_robin: 'W'
            };
        var dataAvail = request.getProbe('avail');
        var candidates = transform(settings.providers);
        
        //override with fusion data
		// here's a part of the magic : the fields comming from the fusion feed will be added if missing in the candidates array, or will override the existing one. So for example, the commit, usage, bandwidth and max_bandwidth from fusion will override the pre-defined values (see the providers object)
        var dataFusion = parseFusionData(request.getData('fusion'));
    	if ( dataFusion !== undefined && dataFusion[settings.fusion_feed] !== undefined && dataFusion[settings.fusion_feed][settings.fusion_cdns_key] !== undefined) {
    		candidates.forEach(function(c) { 
	        	var g = dataFusion[settings.fusion_feed][settings.fusion_cdns_key].find(function(f){ return c.alias == f.name;});
	        	if (g !== undefined ) {
	        		for (var key in g) {
	        		    c[key] = g[key];
	        		}
	        	}
	        });
        }
		
		// configuration and override by fusion
		var config = JSON.parse(JSON.stringify(settings.config));
    	if ( dataFusion !== undefined && dataFusion[settings.fusion_feed] !== undefined && dataFusion[settings.fusion_feed][settings.fusion_config_key] !== undefined) {
    		var g = dataFusion[settings.fusion_feed][settings.fusion_config_key];
	        if (g !== undefined ) {
	       		for (var key in g) {
	       		    config[key] = g[key];
	       		}
	       	}
        }
        
        // filter the candidates per their availability
        candidates = candidates.filter(function(e) { 
        	return (e.availabilityType !== undefined
        			&& e.availabilityType.indexOf('radar') > -1 
        			&& dataAvail[e.alias] !== undefined 
        			&& dataAvail[e.alias].avail >= config.radar_availability_threshold 
        			) 
        			|| 
        			(e.availabilityType !== undefined
                	&& e.availabilityType.indexOf('sonar') > -1 /* missing code here */ );
        });
        
        // if no provider remaining, return the default provider
        if ( candidates.length == 0) {
        	response.respond(config.default_provider,settings.providers[config.default_provider].cname);
        	response.setReasonCode( allReasons.default_provider_after_availability_filter);
        	response.setTTL(config.default_ttl);
        	return;
        } 
        
        	
    	// filter per max_bandwidth
    	candidates = candidates.filter(function(c) { 
        	return c.bandwidth < c.max_bandwidth;
        });
    	
    	// if no provider remaining, return the default provider
    	if ( candidates.length == 0) {
        	response.respond(config.default_provider,settings.providers[config.default_provider].cname);
        	response.setReasonCode( allReasons.default_provider_after_bandwidth_filter);
        	response.setTTL(config.default_ttl);
        	return;
        } 
        	
    	// compute the weighted remaining value 
		// the goal is to build a new weight based on the fixed weight and the remaining usage before reaching the commit. The remainingWeight will be used in a round-robin function. The highest remainingWeight has more chance to be chosen. The round-robin function will generate an acceptable distribution.
		// More the CDN usage is increasing, less the CDN will be used.
    	var sum = 0;
    	candidates.forEach(function(c) { 
			if (config.mode == 'WEIGHT_ONLY' ) {
				c.weightedRemaining = c.weight;
			} else {
    			c.weightedRemaining = c.weight * ( 1 - (c.usage / c.commit));
			}
    		sum += c.weightedRemaining;
    	});
		
		// protect against div by zero
		if ( sum == 0 ) {
			sum = 1;
		}
    
    	// round-robin with weighed remaining
    	candidates.forEach(function(c) { 
    		c.round = Math.floor(Math.random() * 1000 * c.weightedRemaining / sum);
    		});
    	
    	//order by round desc
    	candidates = candidates.sort(function(a,b) { return b.round - a.round; });
    	
    	// build response
    	response.respond(candidates[0].alias,candidates[0].cname);
        response.setReasonCode( candidates.length == 1 ? allReasons.only_one_remaining_after_filters :  allReasons.weighted_round_robin);            	
        response.setTTL(config.default_ttl);
        console.log(candidates[0].alias);
    };
    
    /**
     * @param {!Object} data
     */
     function parseFusionData(data) {
         var keys = Object.keys(data),
             i = keys.length,
             key;
         
         while (i --) {
             key = keys[i];
             try {
                 data[key] = JSON.parse(data[key]);
             }
             catch (e) {
                 delete data[key];
             }
         }
         return data;
     }
     
     /**
      * @param {!Object} data
      * from {
      *          'foo': { 'cname': 'bla' }}
      *      }
      *      to
      *     [ { "alias" : "foo", "cname" : 'bla' }
      *     ] 
      */
      function transform(data) {
          
    	  var keys = Object.keys(data),
              i = keys.length,
              key,
              result = [];
          
          while (i --) {
              key = keys[i];
              try {
            	  var clone = JSON.parse(JSON.stringify(data[key]));
            	  clone.alias = key;
            	  result.push(clone);
              }
              catch (e) {
                  delete data[key];
              }
          }
          return result;
      }
     
     
}
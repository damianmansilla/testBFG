var handler = new OpenmixApplication({
    // if roundrobin = true, the platform will be added to the list of platforms available in the RR logic
    // countries = list of countries where the platform should be considered (platform won't be taken into account in other countries)
    // if handicap = 0, no handicap applied if handicap > 0, the RTT is multiplied by handicap such as : RTT(final) = RTT(initial) * handicap
    // So for 30% handicap, please set handicap = 1.3
    providers: {
        'cloudflare_private': {
            cname: 'code.abtasty.com.cdn.cloudflare.net',
            roundrobin: false,
            handicap: 0
        },
        'cloudfront_private': {
            cname: 'd1bpdvqzr2w2i4.cloudfront.net',
            roundrobin: false,
            handicap: 10
        },
        'cdn1_abtasty': {
            cname: 'cdn1.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn2_abtasty': {
            cname: 'cdn2.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn3_abtasty': {
            cname: 'cdn3.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn4_abtasty': {
            cname: 'cdn4.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn6_abtasty': {
            cname: 'cdn6.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn7_abtasty': {
            cname: 'cdn7.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn8_abtasty': {
            cname: 'cdn8.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn9_abtasty': {
            cname: 'cdn9.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn10_abtasty': {
            cname: 'cdn10.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn11_abtasty': {
            cname: 'cdn11.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn12_abtasty': {
            cname: 'cdn12.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn13_abtasty': {
            cname: 'cdn13.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdn14_abtasty': {
            cname: 'cdn14.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['FR', 'PL', 'CZ', 'BE', 'CH', 'JE', 'LU', 'NL', 'DE']
        },
        'cdnau1_abtasty': {
            cname: 'cdnau1.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['AU']
        },
        'cdnau2_abtasty': {
            cname: 'cdnau2.abtasty.com',
            roundrobin: true,
            handicap: 0,
            countries: ['AU']
        }
    },
    default_provider: 'cloudfront_private',
    default_ttl: 20,
    min_valid_rtt_score: 7,
    // when set true if one of the provider has not data it will be removed,
    // when set to false, sonar data is optional, so a provider with no sonar data will be used
    need_avail_data: true,
    // list of countries where the Round Robin logic is applied between the providers having a parameter "rounrobin = true"
    country_override: {
        'FR' : true,
        'PL' : true,
        'CZ' : true,
        'BE' : true,
        'CH' : true,
        'JE' : true,
        'LU' : true,
        'NL' : true,
        'DE' : true,
        'AU' : true
    },
    need_rtt_data: true,
    //Set Sonar threshold for availability for the platform to be included.
    // sonar values are between 0 - 1
    avail_threshold: 90
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

    var aliases = Object.keys(settings.providers);

    /** @param {OpenmixConfiguration} config */
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
        var decisionTtl = settings.default_ttl,
            candidates,
            candidatesRR,
            candidatesNoRR,
            dataAvail = request.getProbe('avail'),
            dataRtt = request.getProbe('http_rtt'),
            decisionProvider,
            decisionReason = [],
			allReasons,
            candidateAliases,
            candidateAliasesRR,
            candidateAliasesNoRR,
			candidatesAvail,
			candidatesRtt,
			rttLength,
			availLength;

        allReasons = {
			one_acceptable_provider: 'A',
			best_provider_selected: 'B',
			no_available_providers: 'C',
			default_provider: 'D',
			avail_data_not_robust: 'E',
			radar_rtt_not_robust: 'F',
			geo_override_no_available_providers: 'G',
			geo_override_rr: 'H',
			geo_override_failovercdn: 'I',
			best_available_provider: 'J',
			best_rtt_provider: 'K',
			rr_selected: 'L'
		};

        /**
         * @param val
         */
        function filterRoundRobin(val) {
            return function (key) {
                return (settings.providers[key].roundrobin === val);
            };
        }

        /**
         * @param key
         */
        function filterInvalidRttScores(key) {
            if (dataRtt[key] === undefined) {
                return !settings.need_rtt_data;
            }
            return dataRtt[key].http_rtt >= settings.min_valid_rtt_score;
        }

        function filterCountryOverride(key) {
			var provider = settings.providers[key];

			return provider.countries === undefined || provider.countries.indexOf(request.country) !== -1;
        }

		function filterAvailability(key) {
			// let the flag determine if the provider is available when we don't have sonar data for the provider
			if (dataAvail[key] === undefined) {
				return !settings.need_avail_data;
			}
			return dataAvail[key].avail >= settings.avail_threshold;
		}

        /**
         * @param key
         */
        function filterAvail(key) {
            var provider = settings.providers[key],
                countryFilter = provider.countries === undefined || provider.countries.indexOf(request.country) !== -1;

            // let the flag determine if the provider is available when we don't have sonar data for the provider
            if (dataAvail[key] === undefined) {
                return !settings.need_avail_data && countryFilter;
            }
            return dataAvail[key].avail >= settings.avail_threshold && countryFilter;
        }

        /**
         * @param reason
         */
        function selectAnyProvider(reason) {
            // radar or sonar data not available, select any sonar available provider
            var i = aliases.length,
                n = 0,
                candidates = [];

            while (i --) {
                if (filterAvail(aliases[i])) {
                    candidates[n ++] = aliases[i];
                }
            }

            if (n === 0) {
                decisionProvider = settings.default_provider;
                decisionReason.push(allReasons.no_available_providers);
                decisionReason.push(allReasons.default_provider);
            } else if (n === 1) {
                decisionProvider = candidates[0];
                decisionReason.push(reason);
            } else {
                decisionProvider = candidates[(Math.random() * n) >> 0];
                decisionReason.push(reason);
            }
        }
        if ( settings.country_override[request.country] !== undefined) {
            candidates = filterObject(dataRtt, filterInvalidRttScores);
            candidates = filterObject(candidates, filterAvail);
            candidatesRR = filterObject(candidates, filterRoundRobin(true));
            candidatesNoRR = filterObject(candidates, filterRoundRobin(false));
            candidateAliasesRR = Object.keys(candidatesRR);
            candidateAliasesNoRR = Object.keys(candidatesNoRR);
            if (candidateAliasesRR.length === 0 && candidateAliasesNoRR.length === 0) {
                // No available providers
                selectAnyProvider(allReasons.geo_override_no_available_providers);
            } else if (candidateAliasesRR.length > 0) {
                // RR
                decisionProvider = candidateAliasesRR[Math.floor(Math.random() * candidateAliasesRR.length)];
                decisionReason.push(allReasons.geo_override_rr);
            } else if (candidateAliasesNoRR.length > 0) {
                // Failover CDN
                decisionProvider = getLowest(candidatesNoRR, 'http_rtt', false);
                decisionReason.push(allReasons.geo_override_failovercdn);
            }
        }
        else {
			candidates = filterObject(settings.providers, filterCountryOverride);
			candidateAliases = Object.keys(candidates);

			if (candidateAliases.length > 0) {

				candidatesAvail = intersectObjects(candidates, dataAvail, 'avail');
				candidatesRtt = intersectObjects(candidates, dataRtt, 'http_rtt');
				availLength = Object.keys(candidatesAvail).length;
				rttLength = Object.keys(candidatesRtt).length;


				if (availLength === candidateAliases.length) {
					if (rttLength === candidateAliases.length) {
						// ORTT
						candidates = filterObject(candidatesAvail, filterAvailability);
						candidates = intersectObjects(candidates, dataRtt, 'http_rtt');
						candidates = filterObject(candidates, filterInvalidRttScores);
						candidateAliases = Object.keys(candidates);

						if (candidateAliases.length === 0) {
							// No available providers
							decisionProvider = getHighest(candidates, 'avail');
							decisionReason.push(allReasons.no_available_providers);
						}
						else if (candidateAliases.length === 1) {
							// if only one available, return available
							decisionProvider = candidateAliases[0];
							decisionReason.push(allReasons.one_acceptable_provider);
						}
						else {
							// we've got more than 1 available / rtt provider, route based on rtt
							decisionProvider = getLowest(candidates, 'http_rtt', true);
							decisionReason.push(allReasons.best_provider_selected);
						}
					} else {
						// best avail
						decisionProvider = getHighest(candidatesAvail, 'avail');
						decisionReason.push(allReasons.best_available_provider);
						decisionReason.push(allReasons.radar_rtt_not_robust);
					}
				} else if (availLength > 0) {
					decisionReason.push(allReasons.avail_data_not_robust);
					// Filter avail
					candidates = filterObject(candidatesAvail, filterAvailability);

					if (Object.keys(candidates).length > 0) {
						// best avail
						decisionProvider = getHighest(candidates, 'avail');
						decisionReason.push(allReasons.best_available_provider);
					} else {
						// RR
						decisionProvider = candidateAliases[Math.floor(Math.random() * candidateAliases.length)];
						decisionReason.push(allReasons.rr_selected);
					}
				} else {
					decisionReason.push(allReasons.avail_data_not_robust);
					// None avail
					if (rttLength === candidateAliases.length) {
						// best rtt
						decisionProvider = getLowest(candidatesRtt, 'http_rtt', true);
						decisionReason.push(allReasons.best_rtt_provider);
					} else {
						// RR
						decisionProvider = candidateAliases[Math.floor(Math.random() * candidateAliases.length)];
						decisionReason.push(allReasons.rr_selected);
					}
				}
			}
        }

        if (decisionProvider === undefined) {
			decisionProvider = settings.default_provider;
			decisionReason.push(allReasons.default_provider);
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(decisionTtl);
        response.setReasonCode(decisionReason.join(','));
    };

    /**
     * @param object
     * @param filter
     */
	function filterObject(object, filter) {
		var keys = Object.keys(object),
			i = keys.length,
			key,
			candidates = {};

		while (i --) {
			key = keys[i];

			if (filter(key)) {
				candidates[key] = object[key];
			}
		}

		return candidates;
	}

    /**
     * @param source
     * @param property
     * @param applyhandicap
     */
    function getLowest(source, property, applyhandicap) {
        var keys = Object.keys(source),
            i = keys.length,
            key,
            candidate,
            min = Infinity,
            value;

        while (i --) {
            key = keys[i];
            value = source[key][property];
            if (applyhandicap && settings.providers[key] !== undefined && settings.providers[key].handicap !== undefined && settings.providers[key].handicap > 0) {
                value = settings.providers[key].handicap * value;
            }

            if (value < min) {
                candidate = key;
                min = value;
            }
        }

        return candidate;
    }


	/**
	 * @param {!Object} source
	 * @param {string} property
	 */
	function getHighest(source, property) {
		var keys = Object.keys(source),
			i = keys.length,
			key,
			candidate,
			max = -Infinity,
			value;

		while (i --) {
			key = keys[i];
			value = source[key][property];
			if (value > max) {
				candidate = key;
				max = value;
			}
		}
		return candidate;
	}


	/**
	 * @param {!Object} target
	 * @param {Object} source
	 * @param {string} property
	 */
	function intersectObjects(target, source, property) {
		var keys = Object.keys(target),
			i = keys.length,
			key,
			candidates = {};
		while (i --) {
			key = keys[i];
			if (source[key] !== undefined && source[key][property] !== undefined) {
				candidates[key] = target[key];
				candidates[key][property] = source[key][property];
			}
		}
		return candidates;
	}

}
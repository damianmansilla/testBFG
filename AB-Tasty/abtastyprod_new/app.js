var handler = new OpenmixApplication({
    // if roundrobin = true, the platform will be added to the list of platforms available in the RR in France
    // if handicap = 0, no handicap applied if handicap > 0, the RTT is multiplied by handicap such as : RTT(final) = RTT(initial) * handicap
    // So for 30% handicap, please set handicap = 1.3
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
        'cdn6_abtasty': {
            cname: 'cdn6.abtasty.com',
            roundrobin: true,
            handicap: 0
        },
        'cdn7_abtasty': {
            cname: 'cdn7.abtasty.com',
            roundrobin: true,
            handicap: 0
        },
        'cdn8_abtasty': {
            cname: 'cdn8.abtasty.com',
            roundrobin: true,
            handicap: 0
        },
        'cdn9_abtasty': {
            cname: 'cdn9.abtasty.com',
            roundrobin: true,
            handicap: 0
        },
        'cdn10_abtasty': {
            cname: 'cdn10.abtasty.com',
            roundrobin: true,
            handicap: 0
        },
        'cloudflare_private': {
            cname: 'code.abtasty.com.cdn.cloudflare.net',
            roundrobin: false,
            handicap: 0
        },
        /*'cdn6_abtasty': {
         cname: 'cdn6.abtasty.com',
         roundrobin: false,
         handicap: 0
         },*/
        /*'cdn7_abtasty': {
         cname: 'cdn7.abtasty.com',
         roundrobin: false,
         handicap: 0
         },*/
        'cloudfront_private': {
            cname: 'd1bpdvqzr2w2i4.cloudfront.net',
            roundrobin: false,
            handicap: 10
        }
    },
    // Override the handicap of the providers for an specific country
    country_handicap_override: {
        'AR': {
            'cdn10_abtasty': 10,
            'cdn8_abtasty': 50
        }
    },
    default_provider: 'cloudfront_private',
    default_ttl: 25,
    min_valid_rtt_score: 7,
    // when set true if one of the provider has not data it will be removed,
    // when set to false, sonar data is optional, so a provider with no sonar data will be used
    need_avail_data: true,
    need_rtt_data: true,
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

    var reasons = {
        one_acceptable_provider: 'A',
        best_provider_selected: 'B',
        no_available_providers: 'C',
        default_provider: 'D',
        fr_no_available_providers: 'E',
        fr_rr: 'F',
        fr_failovercdn: 'G'
    };

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
            reasonCode,
            country = request.country,
            candidateAliases,
            candidateAliasesRR,
            candidateAliasesNoRR;

        /**
         * @param val
         */
        function filterRoundRobin(val) {
            return function (key) {
                return (settings.providers[key].roundrobin === val);
            };
        }

        /**
         * @param source
         * @param property
         */
        function getLowest(source, property, applyhandicap) {
            var keys = Object.keys(source),
                i = keys.length,
                key,
                candidate,
                min = Infinity,
                value,
                handicapOverride = settings.country_handicap_override[country];

            while (i --) {
                key = keys[i];
                value = source[key][property];
                if (applyhandicap) {
                    // Check first handicap override by country
                    if (handicapOverride !== undefined && handicapOverride[key] !== undefined && handicapOverride[key] > 0) {
                        value = handicapOverride[key] * value;
                    } else if (settings.providers[key] !== undefined && settings.providers[key].handicap !== undefined && settings.providers[key].handicap > 0) {
                        value = settings.providers[key].handicap * value;
                    }
                }

                if (value < min) {
                    candidate = key;
                    min = value;
                }
            }

            return candidate;
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

        /**
         * @param key
         */
        function filterAvail(key) {
            // let the flag determine if the provider is available when we don't have sonar data for the provider
            if (dataAvail[key] === undefined) {
                return !settings.need_avail_data;
            }
            return (dataAvail[key].avail >= settings.avail_threshold);
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
                reasonCode = reasons.no_available_providers + reasons.default_provider;
            } else if (n === 1) {
                decisionProvider = candidates[0];
                reasonCode = reason;
            } else {
                decisionProvider = candidates[(Math.random() * n) >> 0];
                reasonCode = reason;
            }
        }

        if (country == 'FR') {
            candidates = filterObject(dataRtt, filterInvalidRttScores);
            candidates = filterObject(candidates, filterAvail);
            candidatesRR = filterObject(candidates, filterRoundRobin(true));
            candidatesNoRR = filterObject(candidates, filterRoundRobin(false));
            candidateAliasesRR = Object.keys(candidatesRR);
            candidateAliasesNoRR = Object.keys(candidatesNoRR);
            if (candidateAliasesRR.length === 0 && candidateAliasesNoRR.length === 0) {
                // No available providers
                selectAnyProvider(reasons.fr_no_available_providers);
            } else if (candidateAliasesRR.length > 0) {
                // RR
                decisionProvider = candidateAliasesRR[Math.floor(Math.random() * candidateAliasesRR.length)];
                reasonCode = reasons.fr_rr;
            } else if (candidateAliasesNoRR.length > 0) {
                // Failover CDN
                decisionProvider = getLowest(candidatesNoRR, 'http_rtt', false);
                reasonCode = reasons.fr_failovercdn;
            }
        } else {
            candidates = filterObject(dataRtt, filterInvalidRttScores);
            candidates = filterObject(candidates, filterAvail);
            candidateAliases = Object.keys(candidates);

            if (candidateAliases.length === 0) {
                // No available providers
                selectAnyProvider(reasons.no_available_providers);
            }
            else if (candidateAliases.length === 1) {
                // if only one available, return available
                decisionProvider = candidateAliases[0];
                reasonCode = reasons.one_acceptable_provider;
            }
            else {
                // we've got more than 1 available / rtt provider, route based on rtt
                decisionProvider = getLowest(candidates, 'http_rtt', true);
                reasonCode = reasons.best_provider_selected;
            }
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(decisionTtl);
        response.setReasonCode(reasonCode);
    };

    /**
     * @param object
     * @param filter
     */
    function filterObject(object, filter) {
        var cloneObj = JSON.parse(JSON.stringify(object)),
            keys = Object.keys(cloneObj),
            i = keys.length,
            key;

        while (i --) {
            key = keys[i];

            if (!filter(key)) {
                delete cloneObj[key];
            }
        }

        return cloneObj;
    }

}
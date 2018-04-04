var handler = new OpenmixApplication({
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

        // Register the providers that will be selected from
        while (i --) {
            config.requireProvider(aliases[i]);
        }

    };

    /**
     * @param {OpenmixRequest} request
     * @param {OpenmixResponse} response
     */
    this.handle_request = function(request, response) {
        var dataAvail = request.getProbe('avail'),
            /** @type { !Object.<string, { health_score: { value:string }, availability_override:string}> } */
            dataFusion = parseFusionData(request.getData('fusion')),
            country = request.country,
            allReasons,
            decisionProvider,
            decisionReason = [],
            candidates = settings.providers,
            candidateAliases,
            providers = settings.default_override.providers,
            failoverCandidate = settings.default_override.failover_provider,
            availabilityThreshold = settings.availability_threshold,
            geoOverride = false; //will set to 'true' if settings.country_override mapping is used

        allReasons = {
            country_override_best_provider_available: 'A',
            country_override_failover_provider: 'B',
            default_override_best_provider_available: 'C',
            default_override_failover_provider: 'D',
            data_problem: 'E'

        };

        /**
         * @param candidate
         * @param key
         */
        function filterRadarAvailability(candidate, key) {
            return dataAvail[key] !== undefined && dataAvail[key].avail >= availabilityThreshold;
        }

        /**
         * @param candidate
         * @param key
         */
        function filterSonarAvailability(candidate, key) {
            // let the flag determine if the provider is available when we don't have sonar data for the provider
            if (dataFusion[key] !== undefined && dataFusion[key].health_score !== undefined && dataFusion[key].availability_override === undefined) {
                return dataFusion[key].health_score.value > settings.fusion_sonar_threshold;
            }
            return !settings.require_sonar_data;
        }


        if (settings.country_override[country] !== undefined) {
            providers = settings.country_override[country].providers;
            failoverCandidate = settings.country_override[country].failover_provider;
            geoOverride = true;
        }

        if (providers && providers.length > 0
            && Object.keys(dataAvail).length > 0
            && (Object.keys(dataFusion).length > 0 || !settings.require_sonar_data)) {

            //filter Radar and Sonar availability
            candidates = filterObject(candidates, filterRadarAvailability);
            if (settings.require_sonar_data && dataFusion[Object.keys(dataFusion)[0]].availability_override === undefined) {
                candidates = filterObject(candidates, filterSonarAvailability);
            }
            candidateAliases = Object.keys(candidates);

            if (candidateAliases.length > 0) {
                var i = 0;
                while (i < providers.length && decisionProvider === undefined) {
                    if (candidateAliases.indexOf(providers[i]) !== -1) {
                        decisionProvider = providers[i];
                        if (geoOverride) {
                            decisionReason.push(allReasons.country_override_best_provider_available);
                        }
                        else {
                            decisionReason.push(allReasons.default_override_best_provider_available);
                        }
                    }
                    i++;
                }
            }
        }
        else {
            decisionReason.push(allReasons.data_problem);
        }

        if (decisionProvider === undefined) {
            decisionProvider = failoverCandidate;
            if (geoOverride) {
                decisionReason.push(allReasons.country_override_failover_provider);
            }
            else {
                decisionReason.push(allReasons.default_override_failover_provider);
            }
        }

        response.respond(decisionProvider, settings.providers[decisionProvider].cname);
        response.setTTL(settings.default_ttl);
        response.setReasonCode(decisionReason.join(','));
    };

    /**
     * @param {!Object} object
     * @param {Function} filter
     */
    function filterObject(object, filter) {
        var keys = Object.keys(object),
            i = keys.length,
            key,
            candidates = {};
        while (i --) {
            key = keys[i];
            if (filter(object[key], key)) {
                candidates[key] = object[key];
            }
        }
        return candidates;
    }

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
}
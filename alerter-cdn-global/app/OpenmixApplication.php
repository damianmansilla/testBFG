<?php

class OpenmixApplication implements Lifecycle
{

    public $provider = 'level3';
    public $providers = array(
        'level3' => 'lvl3',
        'bitgravity' => 'bitg',
        'netdna' => 'netd',
        'akamai__vip' => 'aka',
        'limelight' => 'llnw',
        'cdnetworks' => 'cdnet',
        'chinacache' => 'cncache',
        'highwinds' => 'hw',
        'edgecast__small' => 'edgs',
        'cloudfront' => 'cf',
        'azure_cdn' => 'azcdn',
        'internap_agilecast' => 'inapacast'
    );
    
    private $ttl = 20;
    
    /**
     * @param Configuration $config
     */
    public function init($config)
    {
        $config->declareInput(
            RadarProbeTypes::AVAILABILITY,
            implode(',', array_keys($this->providers)));
        
        $config->declareInput(
            RadarProbeTypes::HTTP_RTT,
            implode(',', array_keys($this->providers)));
        
        $config->declareInput(RequestProperties::HOSTNAME);
        
        foreach ($this->providers as $alias => $cname)
        {
            $config->declareResponseOption($alias, $cname, $this->ttl);
        }
    }
    
    /**
     * @param Request $request
     * @param Response $response
     * @param Utilities $utilities
     */
    public function service($request, $response, $utilities)
    {
        // should we use avail or rtt?
        $type = $request->request(RequestProperties::HOSTNAME);
        //print("\ntype: $type");
        
        if ($type === 'avail') {
            $perf_data = $request->radar(RadarProbeTypes::AVAILABILITY);
        }
        elseif ($type === 'rtt') {
            $perf_data = $request->radar(RadarProbeTypes::HTTP_RTT);
        } 
        //print("\ndata:\n" . print_r($perf_data, true));
        
        if (is_array($perf_data)) {
            $candidates = array_intersect_key($perf_data, $this->providers);
            //print("\ncandidates:\n" . print_r($candidates, true));
            if (0 < count($candidates)) {
                $cname = "";
                foreach (array_keys($this->providers) as $alias) {
                    if (array_key_exists($alias, $perf_data)) {
                        $cname .= sprintf("$alias-%01.2f-", $perf_data[$alias]);
                    }
                    else {
                        $cname .= "$alias-0-";
                    }
                }
                
                //print("\ncname: $cname");
                $response->respond($this->provider, $cname . 'a.c.com');
            }
            else {
                $response->respond($this->provider, 'noarray.com');
            }
        }
        else {
            $response->respond($this->provider, 'unknown.com');
        }
    }
}
?>
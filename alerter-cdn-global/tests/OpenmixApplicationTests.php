<?php

require_once 'TestHelper.php';
require_once(APP_DIR . '/OpenmixApplication.php');

class OpenmixApplicationTests extends PHPUnit_Framework_TestCase
{
    /**
     * @test
     */
    public function init()
    {
        $config = $this->getMock('Configuration');
        $application = new OpenmixApplication();
        $application->init($config);
    }
    
    /**
     * @test
     */
    public function service()
    {
        $test_data = array(
            array(
                'providers' => array( 'a' => 'a prefix', 'b' => 'b prefix', 'c' => 'c prefix' ),
                'hostname' => 'avail',
                'avail' => array( 'a' => 99, 'b' => 99.1, 'c' => 99.99 ),
                'cname' => 'a-99.00-b-99.10-c-99.99-a.c.com'
            ),
            array(
                'providers' => array( 'a' => 'a prefix', 'b' => 'b prefix', 'c' => 'c prefix' ),
                'hostname' => 'rtt',
                'rtt' => array( 'a' => 101.11, 'b' => 102.22, 'c' => 103.33 ),
                'cname' => 'a-101.11-b-102.22-c-103.33-a.c.com'
            ),
            array(
                'providers' => array( 'a' => 'a prefix', 'b' => 'b prefix', 'c' => 'c prefix' ),
                'hostname' => '',
                'cname' => 'blah'
            ),
        );
        
        foreach ($test_data as $i) {
            $request = $this->getMock('Request');
            $response = $this->getMock('Response');
            $utilities = $this->getMock('Utilities');
            $application = new OpenmixApplication();
            
            // Setup
            $application->providers = $i['providers'];
            
            $call_index = 0;
            $request->expects($this->at($call_index++))
                ->method('request')
                ->with('string:request:hostname')
                ->will($this->returnValue($i['hostname']));
                
            if (array_key_exists('avail', $i)) {
                $request->expects($this->at($call_index++))
                    ->method('radar')
                    ->with('real:score:avail')
                    ->will($this->returnValue($i['avail']));
            }
            
            if (array_key_exists('rtt', $i)) {
                $request->expects($this->at($call_index++))
                    ->method('radar')
                    ->with('real:score:http_rtt')
                    ->will($this->returnValue($i['rtt']));
            }
            
            $response->expects($this->once())
                ->method('respond')
                ->with('level3', $i['cname']);
            
            // Code under test
            $application->service($request, $response, $utilities);
            $this->verifyMockObjects();
        }
    }
}

?>
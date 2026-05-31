<?php
    require_once $_SERVER['DOCUMENT_ROOT'] . '/payment/lib/rcon.class.php';
    require $_SERVER['DOCUMENT_ROOT'] . '/payment/db.php';

    function rcon_command($command) {
        global $config;
        $rcon = new Rcon($config['rcon']['ip'], $config['rcon']['port'], $config['rcon']['password'], 10);
        if ($rcon->connect()) {
            $rcon->send_command($command);
            $rcon->disconnect();

            return true;
        }
        return false;
    }

    function result($id, $sum) {
        global $dbShop;
        global $config;
        $item = db_query($dbShop, "SELECT * FROM payments WHERE id = ? LIMIT 1", [
            intval($id)
        ]);
        if ($item) {
            $item = $item[0];
            if ($sum >= $item['price']) {
                if ($item['status'] == 0) {
                    //Rcon process command
                    $goods = json_decode($item['goods'], true);
                    foreach ($goods as $goodIndex => $good) {
                        $goodItem = explode("_", $good['id']);
                        $goodItem = $config['categories'][$goodItem[0]]['products'][$goodItem[1]];
                        for ($i = 0; $i < $good['qty']; $i++) {
                            $command = str_replace("%user%", $item['nick'], $goodItem['command']);
                            if (!rcon_command($command)) {
                                db_query($dbShop, "UPDATE payments SET status = 2 WHERE id = ?", [
                                    intval($id)
                                ]);
                                return;
                            }
                        }
                    }
                    
                    db_query($dbShop, "UPDATE payments SET status = 1 WHERE id = ?", [
                        intval($id)
                    ]);
                }
            }
        }
    }
?>
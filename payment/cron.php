<?php
    require_once __DIR__ . '/functions.php';
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/lib/rcon.class.php';
    require __DIR__ . '/db.php';

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

    global $dbShop;
    global $config;
    $items = db_query($dbShop, "SELECT * FROM payments WHERE status = 2", []);
    foreach ($items as $itemIndex => $item) {
        //Rcon process command
        $goods = json_decode($item['goods'], true);
        $f1 = false;
        foreach ($goods as $goodIndex => $good) {
            $goodItem = explode("_", $good['id']);
            $goodItem = $config['categories'][$goodItem[0]]['products'][$goodItem[1]];
            for ($i = 0; $i < $good['qty']; $i++) {
                $command = str_replace("%user%", $item['nick'], $goodItem['command']);
                if (!rcon_command($command)) {
                    $f1 = true;
                    break;
                }
            }
        }
        if ($f1)
            continue;
        
        db_query($dbShop, "UPDATE payments SET status = 1 WHERE id = ?", [
            intval($item['id'])
        ]);
    }
?>
<?php

    $dbconfig = $config["db"];
    $db = new mysqli($dbconfig["host"], $dbconfig["user"],
        $dbconfig["password"], $dbconfig["db"], $dbconfig["port"]);
    $dbconfig = $config["dbShop"];
    $dbShop = new mysqli($dbconfig["host"], $dbconfig["user"],
        $dbconfig["password"], $dbconfig["db"], $dbconfig["port"]);

    if (!$db) {
        error("Ошибка подключения к БД");
    }

    function detect_type($value) {
        switch (gettype($value)) {
            case 'string':
                return 's';
                break;
            case 'integer':
                return 'i';
                break;
            case 'blob':
                return 'b';
                break;
            case 'double':
                return 'd';
                break;
        }
        return '';
    }

    function returnRef(array &$arr)
    {
        //Referenced data array is required by mysqli since PHP 5.3+
        if (strnatcmp(phpversion(), '5.3') >= 0) {
            $refs = array();
            foreach ($arr as $key => $value) {
                $refs[$key] = & $arr[$key];
            }
            return $refs;
        }
        return $arr;
    }

    function db_query($mysqli, $query, $data) {
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            die($mysqli->error);
        }

        $types = '';
        
        for ($i = 0; $i < count($data); $i++) {
            $value = $data[$i];
            $types .= detect_type($value);
        }

        $stmt->bind_param($types, ...$data);
        $result = $stmt->execute();
        if (!$result)
            return false;


        $result = $stmt->get_result();

        $output = [];

        if (is_bool($result))
            return $result;

        while ($row = $result->fetch_assoc()) {
            $output[] = $row;
        }
        return $output;
    }

    function db_last_id($mysqli) {
        return $mysqli->insert_id;
    }

//Array ( [csrf] => 0 [id] => 1 [nick] => 23233232@gmail.com [promo] => [email] => 23233232@gmail.com [payment] => qiwi ) 1
<?php

    function json_response($obj) {
        echo json_encode($obj, JSON_UNESCAPED_UNICODE);
        exit;
    }

    function error($text) {
        json_response(array(
            'status' => 'error',
            'response' => $text,
            'displayPriceDiscount' => fcost(0),
            'displayPrice' => fcost(0)
        ));
    }

    function fcost($cost) {
        return number_format($cost, 0, ',', ' ') . ' ₽';
    }

    function redirect($url) {
        http_response_code(302);
        header("Location: $url");
        exit;
    }
?>
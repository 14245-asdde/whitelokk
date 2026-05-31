<?php

    if ($_SERVER["CONTENT_TYPE"] !== 'application/json') {
        $get_array = json_decode($_POST['data'], true);
        if (!preg_match('/[0-9A-Za-zА-Яа-я]{4,16}/u', $get_array['nick'])) {
            redirect("/");
        }
        
        if (!filter_var($get_array['email'], FILTER_VALIDATE_EMAIL)) {
            redirect("/");
        }

        function checkCart($cart) {
            foreach ($cart as $cartId => $cartItem) {
                if ($cartItem['qty'] == 0)
                    return false;
            }
            return true;
        }

        if (!isset($get_array['cart']) || !checkCart($get_array['cart'])) {
            redirect("/");
        }
    } else {
        $get_string = file_get_contents("php://input");
        $get_array = json_decode($get_string, true);
        if (!preg_match('/[0-9A-Za-zА-Яа-я]{4,16}/u', $get_array['nick'])) {
            error("Введите ник");
        }
        if (!filter_var($get_array['email'], FILTER_VALIDATE_EMAIL)) {
            error("Введите e-mail");
        }
    
        function checkCart($cart) {
            foreach ($cart as $cartId => $cartItem) {
                if ($cartItem['qty'] == 0)
                    return false;
            }
            return true;
        }
    
        if (!isset($get_array['cart']) || !checkCart($get_array['cart'])) {
            error("Корзина пуста");
        }
    }


?>
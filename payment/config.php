<?php

$config = [
    "site_name" => "RAGEMINE", // Название сервера
    "description" => "", // Описание
    "keywords" => "ragemine, minecraft, рейджмайн", // Ключевые слова для поисковиков
    "server_ip" => "MC.RAGEMINE.SU", // IP сервера
    "db" => [ // Данные для доступа к БД
        "host" => "",
        "user" => "",
        "password" => "",
        "db" => "",
        "port" => 3306
    ],
    "dbShop" => [ // Данные для доступа к БД
        "host" => "",
        "user" => "",
        "password" => "",
        "db" => "",
        "port" => 3306
    ],
    "qiwi" => [
        "site_id" => "",
        "public_key" => "",
        "secret_key" => "",
    ],
    "enot" => [
        "public_key" => "",
        "secret_key" => "",
    ],
    "payok" => [
        "public_key" => "",
        "secret_key" => ""
    ],
     "rcon" => [ // Данные для RCON доступа
        "ip" => "",
        "port" => "",
        "password" => ""
    ],
    "categories" => [
        "donate" => [
            "title" => "ПРИВИЛЕГИИ",
            "default" => true,
            "products" => [
                "glava" => [
                    "title" => "ГЛАВА",
                    "price" => 4000,
                    "discount" => 0,
                    "image" => "img/icons/donate/glava.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% glava",
                    "promo_use" => true,
                    "qty" => false
                ],
                "staff" => [
                    "title" => "СТАФФ",
                    "price" => 1000,
                    "discount" => 0,
                    "image" => "img/icons/donate/staff.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% staff",
                    "promo_use" => true,
                    "qty" => false
                ],
                "fobos" => [
                    "title" => "ФОБОС",
                    "price" => 650,
                    "discount" => 0,
                    "image" => "img/icons/donate/fobos.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% fobos",
                    "promo_use" => true,
                    "qty" => false
                ],
                "king" => [
                    "title" => "КОРОЛЬ",
                    "price" => 250,
                    "discount" => 0,
                    "image" => "img/icons/donate/king.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% king",
                    "promo_use" => true,
                    "qty" => false
                ],
                "imperator" => [
                    "title" => "ИМПЕРАТОР",
                    "price" => 150,
                    "discount" => 0,
                    "image" => "img/icons/donate/staff.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% imperator",
                    "promo_use" => true,
                    "qty" => false
                ],
                "wither" => [
                    "title" => "ВИЗЕР",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/donate/wither.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% wither",
                    "promo_use" => true,
                    "qty" => false
                ],
                "kratos" => [
                    "title" => "КРАТОС",
                    "price" => 25,
                    "discount" => 0,
                    "image" => "img/icons/donate/kratos.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% kratos",
                    "promo_use" => true,
                    "qty" => false
                ],
                "prince" => [
                    "title" => "ПРИНЦ",
                    "price" => 15,
                    "discount" => 0,
                    "image" => "img/icons/donate/glava.png",
                    "withSurcharge" => true,
                    "command" => "sc %user% prince",
                    "promo_use" => true,
                    "qty" => false
                ],
            ]
        ],
        "rub" => [
            "title" => "РУБИНЫ",
            "default" => false,
            "products" => [
                "rub-250" => [
                    "title" => "250 РУБИНОВ",
                    "price" => 40,
                    "discount" => 0,
                    "image" => "img/icons/rub/1.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-250",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-500" => [
                    "title" => "500 РУБИНОВ",
                    "price" => 60,
                    "discount" => 0,
                    "image" => "img/icons/rub/2.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-500",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-1000" => [
                    "title" => "1000 РУБИНОВ",
                    "price" => 80,
                    "discount" => 0,
                    "image" => "img/icons/rub/3.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-1000",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-3000" => [
                    "title" => "3000 РУБИНОВ",
                    "price" => 190,
                    "discount" => 0,
                    "image" => "img/icons/rub/4.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-3000",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-6000" => [
                    "title" => "6000 РУБИНОВ",
                    "price" => 300,
                    "discount" => 0,
                    "image" => "img/icons/rub/6.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-6000",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-8000" => [
                    "title" => "8000 РУБИНОВ",
                    "price" => 400,
                    "discount" => 0,
                    "image" => "img/icons/rub/7.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-8000",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-16000" => [
                    "title" => "16000 РУБИНОВ",
                    "price" => 600,
                    "discount" => 0,
                    "image" => "img/icons/rub/8.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-16000",
                    "promo_use" => true,
                    "qty" => false
                ],
                "rub-25000" => [
                    "title" => "25000 РУБИНОВ",
                    "price" => 800,
                    "discount" => 0,
                    "image" => "img/icons/rub/8.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% rub-25000",
                    "promo_use" => true,
                    "qty" => false
                ],
            ]
        ],
        "items" => [
            "title" => "ПРЕДМЕТЫ",
            "default" => false,
            "products" => [
                "kit-grief" => [
                    "title" => "КИТ ГРИФЕРА",
                    "price" => 100,
                    "discount" => 0,
                    "image" => "img/icons/items/grief.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-kit-pack",
                    "promo_use" => true,
                    "qty" => true
                ],
                "kit-staff" => [
                    "title" => "КИТ СТАФФ",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/items/staff.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-kit-pack",
                    "promo_use" => true,
                    "qty" => true
                ],
                "pickaxe-1" => [
                    "title" => "МАГИЧЕСКАЯ",
                    "price" => 200,
                    "discount" => 0,
                    "image" => "img/icons/items/pickaxe1.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-pickaxe-1",
                    "promo_use" => true,
                    "qty" => true
                ],
                "pickaxe-2" => [
                    "title" => "ДРЕВНЯЯ",
                    "price" => 100,
                    "discount" => 0,
                    "image" => "img/icons/items/pickaxe2.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-pickaxe-2",
                    "promo_use" => true,
                    "qty" => true
                ],
                "totem" => [
                    "title" => "ТОТЕМ ПРИЗРАКА",
                    "price" => 40,
                    "discount" => 0,
                    "image" => "img/icons/items/totem.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-totem",
                    "promo_use" => true,
                    "qty" => true
                ],
                "rune" => [
                    "title" => "РУНА ПРИЗРАКА",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/items/rune.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-rune",
                    "promo_use" => true,
                    "qty" => true
                ],
                "arrow" => [
                    "title" => "СТРЕЛА ВОРА",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/items/arrow.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-arrow",
                    "promo_use" => true,
                    "qty" => true
                ],
                "furnace" => [
                    "title" => "СУПЕР ПЕЧЬ",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/items/furnace.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% items-furnace",
                    "promo_use" => true,
                    "qty" => true
                ],
            ]
        ],
        "case" => [
            "title" => "КЕЙСЫ",
            "default" => false,
            "products" => [
                "donate" => [
                    "title" => "С ДОНАТОМ",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/case/donate.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% case-donate",
                    "promo_use" => true,
                    "qty" => true
                ],
                "rub" => [
                    "title" => "С РУБИНАМИ",
                    "price" => 35,
                    "discount" => 0,
                    "image" => "img/icons/case/rub.png",
                    "withSurcharge" => false,
                    "command" => "sc %user% case-rub",
                    "promo_use" => true,
                    "qty" => true
                ],
            ]
        ],
        "other" => [
            "title" => "ПРОЧЕЕ",
            "default" => false,
            "products" => [
                "sub" => [
                    "title" => "ПОДПИСКА",
                    "price" => 200,
                    "discount" => 0,
                    "image" => "img/icons/other/sub.webp",
                    "withSurcharge" => false,
                    "command" => "sc %user% sub",
                    "promo_use" => true,
                    "qty" => false
                ],
                "unban" => [
                    "title" => "РАЗБАН",
                    "price" => 100,
                    "discount" => 0,
                    "image" => "img/icons/other/unban.png",
                    "withSurcharge" => false,
                    "command" => "unban %user%",
                    "promo_use" => true,
                    "qty" => false
                ],
                "suffix" => [
                    "title" => "СВОЙ ТИТУЛ",
                    "price" => 100,
                    "discount" => 0,
                    "image" => "img/icons/other/suffix.png",
                    "withSurcharge" => false,
                    "command" => "",
                    "promo_use" => true,
                    "qty" => false
                ],
                "reestablish" => [
                    "title" => "ВОССТАНОВЛЕНИЕ",
                    "price" => 50,
                    "discount" => 0,
                    "image" => "img/icons/other/reestablish.png",
                    "withSurcharge" => false,
                    "command" => "",
                    "promo_use" => true,
                    "qty" => false
                ],
            ]
        ],
    ],
];

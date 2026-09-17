/**
 * 구단별 감독 및 포지션별 선수단 데이터 (BE PLAYERS 및 STAFFS 테이블 연동)
 * DB TEAM_ID(57, 1044 등) 및 기존 레거시 ID(1~20) 모두 지원
 */
const teamSquadData = {
  "1": {
    "teamId": 1044,
    "apiTeamId": 1044,
    "teamName": "AFC Bournemouth",
    "manager": {
      "name": "Marco Rose",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 4321,
          "name": "David Brooks",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 131260,
          "name": "Evanilson",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 176789,
          "name": "Ben Doak",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 137047,
          "name": "Amine Adli",
          "backNumber": 21,
          "position": "FW",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 204241,
          "name": "Eli Kroupi",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 203356,
          "name": "Rayan",
          "backNumber": 26,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 169191,
          "name": "Daniel Jebbison",
          "backNumber": 29,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 189369,
          "name": "Alvaro Rodriguez",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        }
      ],
      "MF": [
        {
          "id": 3327,
          "name": "Lewis Cook",
          "backNumber": 4,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7561,
          "name": "Justin Kluivert",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 161088,
          "name": "Alex Scott",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34495,
          "name": "Ryan Christie",
          "backNumber": 11,
          "position": "MF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 77596,
          "name": "Tyler Adams",
          "backNumber": 12,
          "position": "MF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 6396,
          "name": "Marcus Tavernier",
          "backNumber": 16,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 192316,
          "name": "Alex Toth",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 273152,
          "name": "Ben Winterburn",
          "backNumber": 47,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 113335,
          "name": "Julian Araujo",
          "backNumber": 2,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 135482,
          "name": "Adrien Truffert",
          "backNumber": 3,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 185610,
          "name": "Antonio Silva",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 82145,
          "name": "James Hill",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 183583,
          "name": "Julio Soler",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 8231,
          "name": "Adam Smith",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 98745,
          "name": "Bafodé Diakité",
          "backNumber": 18,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 180038,
          "name": "Juanlu",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 80765,
          "name": "Max Aarons",
          "backNumber": 28,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 227046,
          "name": "Veljko Milosavljević",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        }
      ],
      "GK": [
        {
          "id": 121765,
          "name": "Đorđe Petrović",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 8079,
          "name": "Fraser Forster",
          "backNumber": 17,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 41381,
          "name": "Michele Di Gregorio",
          "backNumber": 20,
          "position": "GK",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        }
      ]
    }
  },
  "2": {
    "teamId": 57,
    "apiTeamId": 57,
    "teamName": "Arsenal FC",
    "manager": {
      "name": "Mikel Arteta",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 171,
          "name": "Kai Havertz",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 99813,
          "name": "Bukayo Saka",
          "backNumber": 7,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8279,
          "name": "Viktor Gyökeres",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 144434,
          "name": "Christos Tzolis",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 167720,
          "name": "Noni Madueke",
          "backNumber": 20,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 285128,
          "name": "Max Dowman",
          "backNumber": 56,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 8215,
          "name": "Declan Rice",
          "backNumber": 4,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7935,
          "name": "Mikel Merino",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 7427,
          "name": "Martin Ødegaard",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 115035,
          "name": "Martín Zubimendi",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 4032,
          "name": "Eberechi Eze",
          "backNumber": 21,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 1684,
          "name": "Bruno Guimarães",
          "backNumber": 39,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "DF": [
        {
          "id": 98816,
          "name": "Jurrien Timber",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 23128,
          "name": "Gabriel Magalhães",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 172839,
          "name": "Cristhian Mosquera",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 6154,
          "name": "Ben White",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 125674,
          "name": "Piero Hincapié",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 6317,
          "name": "Ezri Konsa",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 80171,
          "name": "William Saliba",
          "backNumber": 17,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 133512,
          "name": "Riccardo Calafiori",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 244120,
          "name": "Myles Lewis-Skelly",
          "backNumber": 49,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 4832,
          "name": "David Raya",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 3189,
          "name": "Kepa Arrizabalaga",
          "backNumber": 13,
          "position": "GK",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 74831,
          "name": "Illan Meslier",
          "backNumber": 30,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ]
    }
  },
  "3": {
    "teamId": 58,
    "apiTeamId": 58,
    "teamName": "Aston Villa FC",
    "manager": {
      "name": "Unai Emery",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 152515,
          "name": "Nicolas Jackson",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 181901,
          "name": "Alejandro Garnacho",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 7985,
          "name": "Tammy Abraham",
          "backNumber": 18,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 265040,
          "name": "Ibrahim M'Baye",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 280446,
          "name": "Brian Madjo",
          "backNumber": 39,
          "position": "FW",
          "nationality": "Luxembourg",
          "koreanNation": "룩셈부르크",
          "flag": "🇱🇺"
        },
        {
          "id": 260718,
          "name": "Alysson",
          "backNumber": 47,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 289528,
          "name": "George Hemmings",
          "backNumber": 53,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7817,
          "name": "Ross Barkley",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34646,
          "name": "John McGinn",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 3181,
          "name": "Leon Goretzka",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 8346,
          "name": "Boubacar Kamara",
          "backNumber": 8,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 212309,
          "name": "Johan Manzambi",
          "backNumber": 9,
          "position": "MF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 31941,
          "name": "Emiliano Buendía",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 114024,
          "name": "Amadou Onana",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 172899,
          "name": "Lamare Bogarde",
          "backNumber": 26,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 138034,
          "name": "João Gomes",
          "backNumber": 35,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "DF": [
        {
          "id": 11644,
          "name": "Matty Cash",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Poland",
          "koreanNation": "폴란드",
          "flag": "🇵🇱"
        },
        {
          "id": 3492,
          "name": "Victor Nilsson-Lindelöf",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 131035,
          "name": "Taylor Harwood-Bellis",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8235,
          "name": "Tyrone Mings",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 151241,
          "name": "Matteo Ruggeri",
          "backNumber": 13,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 33109,
          "name": "Pau Torres",
          "backNumber": 14,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 131120,
          "name": "Ian Maatsen",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 8158,
          "name": "Aaron Wan-Bissaka",
          "backNumber": 29,
          "position": "DF",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 276000,
          "name": "Modou Keba Cisse",
          "backNumber": 48,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        }
      ],
      "GK": [
        {
          "id": 118920,
          "name": "Zion Suzuki",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 7675,
          "name": "Marco Bizot",
          "backNumber": 40,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ]
    }
  },
  "4": {
    "teamId": 402,
    "apiTeamId": 402,
    "teamName": "Brentford FC",
    "manager": {
      "name": "Keith Andrews",
      "role": "감독 (Head Coach)",
      "nationality": "Ireland",
      "koreanNation": "아일랜드",
      "flag": "🇮🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 138230,
          "name": "Thiago",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 177305,
          "name": "Dango Ouattara",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Burkina Faso",
          "koreanNation": "부르키나파소",
          "flag": "🇧🇫"
        },
        {
          "id": 8251,
          "name": "Callum Wilson",
          "backNumber": 13,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 123286,
          "name": "Kevin Schade",
          "backNumber": 16,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 150778,
          "name": "Jaidon Anthony",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 213296,
          "name": "Gustavo Gomes",
          "backNumber": 39,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 213518,
          "name": "Kaye Furo",
          "backNumber": 47,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "MF": [
        {
          "id": 204421,
          "name": "Yegor Yarmolyuk",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        },
        {
          "id": 10194,
          "name": "Mathias Jensen",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 7796,
          "name": "Josh Dasilva",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 151119,
          "name": "Fabio Carvalho",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 171965,
          "name": "Antoni Milambo",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 150964,
          "name": "Mamadou Sangare",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        },
        {
          "id": 101910,
          "name": "Keane Lewis-Potter",
          "backNumber": 23,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24238,
          "name": "Mikkel Damsgaard",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 10000,
          "name": "Vitaly Janelt",
          "backNumber": 27,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        }
      ],
      "DF": [
        {
          "id": 101111,
          "name": "Aaron Hickey",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 4426,
          "name": "Rico Henry",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 16068,
          "name": "Kristoffer Ajer",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 7720,
          "name": "Sepp van den Berg",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 115642,
          "name": "Nathan Collins",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 193633,
          "name": "El Hadji Malick Diouf",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 204348,
          "name": "Michael Kayode",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 221783,
          "name": "Ji-soo Kim",
          "backNumber": 36,
          "position": "DF",
          "nationality": "South Korea",
          "koreanNation": "대한민국",
          "flag": "🇰🇷"
        },
        {
          "id": 227064,
          "name": "Jannik Schuster",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 245364,
          "name": "Benjamin Fredrick",
          "backNumber": 48,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        }
      ],
      "GK": [
        {
          "id": 102046,
          "name": "Caoimhin Kelleher",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 144530,
          "name": "Hákon Rafn Valdimarsson",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Iceland",
          "koreanNation": "아이슬란드",
          "flag": "🇮🇸"
        },
        {
          "id": 4419,
          "name": "Ellery Balcombe",
          "backNumber": 31,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "5": {
    "teamId": 397,
    "apiTeamId": 397,
    "teamName": "Brighton & Hove Albion FC",
    "manager": {
      "name": "Fabian Hurzeler",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 132707,
          "name": "Kaoru Mitoma",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 209504,
          "name": "Stefanos Tzimas",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 81189,
          "name": "Georginio Rutter",
          "backNumber": 10,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 187482,
          "name": "Yankubah Minteh",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Gambia",
          "koreanNation": "감비아",
          "flag": "🇬🇲"
        },
        {
          "id": 260992,
          "name": "Promise Akinpelu",
          "backNumber": 12,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 205531,
          "name": "Ibrahim Osman",
          "backNumber": 15,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 264300,
          "name": "Charalampos Kostoulas",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 130809,
          "name": "Evan Ferguson",
          "backNumber": 28,
          "position": "FW",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 279784,
          "name": "Zadok Yohanna",
          "backNumber": 36,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        }
      ],
      "MF": [
        {
          "id": 190851,
          "name": "Jack Hinshelwood",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8273,
          "name": "Pascal Groß",
          "backNumber": 13,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 270273,
          "name": "Chema Andrés",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 178951,
          "name": "Diego Gómez",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 145613,
          "name": "Yasin Ayari",
          "backNumber": 26,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 3974,
          "name": "Matt O'Riley",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 246670,
          "name": "Malick Yalcouyé",
          "backNumber": 35,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        },
        {
          "id": 29319,
          "name": "Femi Azeez",
          "backNumber": 39,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 4146,
          "name": "Pascal Struijk",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 8259,
          "name": "Lewis Dunk",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 147891,
          "name": "Jaouen Hadjam",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Algeria",
          "koreanNation": "알제리",
          "flag": "🇩🇿"
        },
        {
          "id": 97505,
          "name": "Mats Wieffer",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 9869,
          "name": "Ferdi Kadıoğlu",
          "backNumber": 20,
          "position": "DF",
          "nationality": "Turkey",
          "koreanNation": "튀르키예",
          "flag": "🇹🇷"
        },
        {
          "id": 185116,
          "name": "Costinha",
          "backNumber": 20,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 846,
          "name": "Olivier Boscagli",
          "backNumber": 21,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 216835,
          "name": "Luka Vušković",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Croatia",
          "koreanNation": "크로아티아",
          "flag": "🇭🇷"
        },
        {
          "id": 61968,
          "name": "Michael Svoboda",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 142075,
          "name": "Maxim De Cuyper",
          "backNumber": 55,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "GK": [
        {
          "id": 126870,
          "name": "Bart Verbruggen",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 4040,
          "name": "Jason Steele",
          "backNumber": 23,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 140203,
          "name": "Thomas McGill",
          "backNumber": 38,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "6": {
    "teamId": 61,
    "apiTeamId": 61,
    "teamName": "Chelsea FC",
    "manager": {
      "name": "Xavi Alonso",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 103125,
          "name": "João Pedro",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179460,
          "name": "Jamie Bynoe-Gittens",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 2074,
          "name": "Pedro Neto",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 3328,
          "name": "Danny Welbeck",
          "backNumber": 18,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 150599,
          "name": "Emanuel Emegha",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 229421,
          "name": "Geovany Quenda",
          "backNumber": 23,
          "position": "FW",
          "nationality": "Guinea-Bissau",
          "koreanNation": "기니비사우",
          "flag": "🇬🇼"
        },
        {
          "id": 244778,
          "name": "Estevao",
          "backNumber": 41,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "MF": [
        {
          "id": 170261,
          "name": "Valentin Barco",
          "backNumber": 4,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 205684,
          "name": "Ray Paez",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 144892,
          "name": "Cole Palmer",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3320,
          "name": "Jordan Henderson",
          "backNumber": 14,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82140,
          "name": "Morgan Rogers",
          "backNumber": 17,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 121103,
          "name": "Moisés Caicedo",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 172738,
          "name": "Romeo Lavia",
          "backNumber": 45,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "DF": [
        {
          "id": 152498,
          "name": "Malo Gusto",
          "backNumber": 2,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 206136,
          "name": "Marco Palestra",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 8545,
          "name": "Wesley Fofana",
          "backNumber": 3,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 170440,
          "name": "Levi Colwill",
          "backNumber": 6,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 56628,
          "name": "Reece James",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 189477,
          "name": "Jorrel Hato",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 82351,
          "name": "Maxence Lacroix",
          "backNumber": 26,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 151251,
          "name": "Pep Chavarría",
          "backNumber": 29,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 209148,
          "name": "Aaron Anselmino",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 249320,
          "name": "Josh Acheampong",
          "backNumber": 34,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 3141,
          "name": "Emiliano Martínez",
          "backNumber": 23,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 175910,
          "name": "Teddy Sharman-Lowe",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191068,
          "name": "Mike Penders",
          "backNumber": 39,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 137544,
          "name": "Gabriel Slonina",
          "backNumber": 44,
          "position": "GK",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        }
      ]
    }
  },
  "7": {
    "teamId": 1076,
    "apiTeamId": 1076,
    "teamName": "Coventry City FC",
    "manager": {
      "name": "Frank Lampard",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 113632,
          "name": "Tatsuhiro Sakamoto",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 146122,
          "name": "Ellis Simms",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6389,
          "name": "Brandon Thomas-Asante",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 6009,
          "name": "Ephron Mason-Clark",
          "backNumber": 10,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 9218,
          "name": "Taiwo Awoniyi",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 170394,
          "name": "Loum Tchaouna",
          "backNumber": 18,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 10076,
          "name": "Haji Wright",
          "backNumber": 19,
          "position": "FW",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 213712,
          "name": "Sidiki Cherif",
          "backNumber": 26,
          "position": "FW",
          "nationality": "Guinea",
          "koreanNation": "기니",
          "flag": "🇬🇳"
        }
      ],
      "MF": [
        {
          "id": 262187,
          "name": "Caleb Yirenkyi",
          "backNumber": 3,
          "position": "MF",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 114123,
          "name": "Jack Rudoni",
          "backNumber": 5,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6358,
          "name": "Matt Grimes",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24210,
          "name": "Frank Onyeka",
          "backNumber": 16,
          "position": "MF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 83372,
          "name": "Josh Eccles",
          "backNumber": 28,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24207,
          "name": "Victor Torp",
          "backNumber": 29,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 9623,
          "name": "Gustavo Hamer",
          "backNumber": 38,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ],
      "DF": [
        {
          "id": 4334,
          "name": "Ethan Pinnock",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 6308,
          "name": "Jay Dasilva",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 144782,
          "name": "Bobby Thomas",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171509,
          "name": "Kaine Kesler",
          "backNumber": 20,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4015,
          "name": "Jake Bidwell",
          "backNumber": 21,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 130044,
          "name": "Joel Latibeaudiere",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 169297,
          "name": "Aurele Amenda",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 4235,
          "name": "Luke Woolfenden",
          "backNumber": 26,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 55048,
          "name": "Milan van Ewijk",
          "backNumber": 27,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 286320,
          "name": "Stephen Mfuni",
          "backNumber": 30,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5347,
          "name": "Ben Wilson",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171498,
          "name": "Carl Rushworth",
          "backNumber": 19,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4418,
          "name": "Daniel Bentley",
          "backNumber": 25,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "8": {
    "teamId": 354,
    "apiTeamId": 354,
    "teamName": "Crystal Palace FC",
    "manager": {
      "name": "Pierre Sage",
      "role": "감독 (Head Coach)",
      "nationality": "France",
      "koreanNation": "프랑스",
      "flag": "🇫🇷"
    },
    "squad": {
      "FW": [
        {
          "id": 7800,
          "name": "Eddie Nketiah",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 152505,
          "name": "Yeremi Pino",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 11623,
          "name": "Dwight McNeil",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 213269,
          "name": "Jørgen Strand Larsen",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 224618,
          "name": "Zavier Gozo",
          "backNumber": 12,
          "position": "FW",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 3638,
          "name": "Ismaïla Sarr",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 641,
          "name": "Jean-Philippe Mateta",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 179319,
          "name": "Darío Osorio",
          "backNumber": 24,
          "position": "FW",
          "nationality": "Chile",
          "koreanNation": "칠레",
          "flag": "🇨🇱"
        },
        {
          "id": 176241,
          "name": "Matheus Franca",
          "backNumber": 27,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 128710,
          "name": "Evann Guessand",
          "backNumber": 29,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 179712,
          "name": "Jesurun Rak-Sakyi",
          "backNumber": 49,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 3737,
          "name": "Jefferson Lerma",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Colombia",
          "koreanNation": "콜롬비아",
          "flag": "🇨🇴"
        },
        {
          "id": 6716,
          "name": "Daichi Kamada",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 8124,
          "name": "Will Hughes",
          "backNumber": 19,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191396,
          "name": "Adam Wharton",
          "backNumber": 20,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 97536,
          "name": "Quinten Timber",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 74677,
          "name": "Cheick Doucouré",
          "backNumber": 28,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        }
      ],
      "DF": [
        {
          "id": 137068,
          "name": "Tyrick Mitchell",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99856,
          "name": "Chris Richards",
          "backNumber": 3,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 813,
          "name": "Axel Disasi",
          "backNumber": 5,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 260271,
          "name": "Jaydee Canvot",
          "backNumber": 6,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 150948,
          "name": "Chadi Riad",
          "backNumber": 18,
          "position": "DF",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 263661,
          "name": "Honest Ahanor",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 9034,
          "name": "Takehiro Tomiyasu",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 213425,
          "name": "Anan Khalaili",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Israel",
          "koreanNation": "이스라엘",
          "flag": "🇮🇱"
        },
        {
          "id": 146986,
          "name": "Óscar Mingueza",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 8065,
          "name": "Ben Chilwell",
          "backNumber": 33,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5457,
          "name": "Dean Henderson",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6413,
          "name": "Remi Matthews",
          "backNumber": 31,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8420,
          "name": "Walter Benítez",
          "backNumber": 44,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        }
      ]
    }
  },
  "9": {
    "teamId": 62,
    "apiTeamId": 62,
    "teamName": "Everton FC",
    "manager": {
      "name": "David Moyes",
      "role": "감독 (Head Coach)",
      "nationality": "Scotland",
      "koreanNation": "스코틀랜드",
      "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
    },
    "squad": {
      "FW": [
        {
          "id": 3895,
          "name": "Jack Grealish",
          "backNumber": 10,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171995,
          "name": "Thierno Barry",
          "backNumber": 11,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 250436,
          "name": "Tyrique George",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 218525,
          "name": "Tyler Dibling",
          "backNumber": 20,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 124694,
          "name": "Brennan Johnson",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        }
      ],
      "MF": [
        {
          "id": 140194,
          "name": "Kiernan Dewsbury Hall",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24102,
          "name": "Christian Nørgaard",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 140269,
          "name": "Carlos Alcaraz",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 136284,
          "name": "Hayden Hackney",
          "backNumber": 30,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 156552,
          "name": "Merlin Röhl",
          "backNumber": 34,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 101076,
          "name": "James Garner",
          "backNumber": 37,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 264281,
          "name": "Harrison Armstrong",
          "backNumber": 45,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7792,
          "name": "Ainsley Maitland-Niles",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 114120,
          "name": "Jarrad Branthwaite",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7829,
          "name": "Michael Keane",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3316,
          "name": "James Tarkowski",
          "backNumber": 6,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 131569,
          "name": "Jake O'Brien",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 16165,
          "name": "Vitalii Mykolenko",
          "backNumber": 16,
          "position": "DF",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        }
      ],
      "GK": [
        {
          "id": 3309,
          "name": "Jordan Pickford",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82135,
          "name": "Mark Travers",
          "backNumber": 23,
          "position": "GK",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 6180,
          "name": "Thomas King",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        }
      ]
    }
  },
  "10": {
    "teamId": 63,
    "apiTeamId": 63,
    "teamName": "Fulham FC",
    "manager": {
      "name": "Álvaro Arbeloa",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 217658,
          "name": "Gonzalo García",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 138036,
          "name": "Rodrigo Muniz",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179122,
          "name": "Kevin Santos",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3392,
          "name": "Alex Iwobi",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 217577,
          "name": "Jonah Kusi-Asare",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 179716,
          "name": "Oscar Bobb",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        }
      ],
      "MF": [
        {
          "id": 3995,
          "name": "Harrison Reed",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 290848,
          "name": "César Palacios",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 8973,
          "name": "Sander Berge",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 3965,
          "name": "Tom Cairney",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 180563,
          "name": "Hugo Larsson",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 192108,
          "name": "Shea Charles",
          "backNumber": 19,
          "position": "MF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 291727,
          "name": "Manuel Angel",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 246418,
          "name": "Joshua King",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 85570,
          "name": "Emile Smith Rowe",
          "backNumber": 32,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 2253,
          "name": "Joachim Andersen",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 8460,
          "name": "Kenny Tete",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 146154,
          "name": "Calvin Bassey",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 98750,
          "name": "Jorge Cuenca",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 3927,
          "name": "Antonee Robinson",
          "backNumber": 5,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 1836,
          "name": "Timothy Castagne",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 123212,
          "name": "David Affengruber",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 3959,
          "name": "Ryan Sessegnon",
          "backNumber": 30,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 217596,
          "name": "Luc De Fougerolles",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        }
      ],
      "GK": [
        {
          "id": 3174,
          "name": "Bernd Leno",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 8366,
          "name": "Benjamin Lecomte",
          "backNumber": 23,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 300279,
          "name": "Alex Borto",
          "backNumber": 36,
          "position": "GK",
          "nationality": "United States",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        }
      ]
    }
  },
  "11": {
    "teamId": 322,
    "apiTeamId": 322,
    "teamName": "Hull City AFC",
    "manager": {
      "name": "Sergej Jakirovic",
      "role": "감독 (Head Coach)",
      "nationality": "Bosnia and Herzegovina",
      "koreanNation": "보스니아",
      "flag": "🇧🇦"
    },
    "squad": {
      "FW": [
        {
          "id": 26444,
          "name": "Sorba Thomas",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 4359,
          "name": "Oliver McBurnie",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 213072,
          "name": "Mohamed Belloumi",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Algeria",
          "koreanNation": "알제리",
          "flag": "🇩🇿"
        },
        {
          "id": 80761,
          "name": "Joe Gelhardt",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 110807,
          "name": "Liam Millar",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 192811,
          "name": "Elliot Stroud",
          "backNumber": 21,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 170777,
          "name": "David Akintola",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 149129,
          "name": "Mohamed Ali Cho",
          "backNumber": 50,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 49092,
          "name": "Hidemasa Morita",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 147914,
          "name": "Eliot Matazo",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 193627,
          "name": "Jens Hjertö-Dahl",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 230388,
          "name": "Óscar Zambrano",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 184963,
          "name": "Darko Gyabi",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6357,
          "name": "Matty Crooks",
          "backNumber": 25,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 11306,
          "name": "Kieran Dowell",
          "backNumber": 26,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4309,
          "name": "Regan Slater",
          "backNumber": 27,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 179603,
          "name": "Lucas Gourna-Douath",
          "backNumber": 29,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 30298,
          "name": "Abdülkadir Ömür",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Turkey",
          "koreanNation": "튀르키예",
          "flag": "🇹🇷"
        },
        {
          "id": 169326,
          "name": "Tim Iroegbunam",
          "backNumber": 42,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 5322,
          "name": "Lewie Coyle",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82148,
          "name": "Ryan John Giles",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 189278,
          "name": "Charlie Hughes",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6451,
          "name": "Semi Ajayi",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 4425,
          "name": "John Egan",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 4058,
          "name": "Paddy McNair",
          "backNumber": 17,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 270733,
          "name": "Lucas Herrington",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Australia",
          "koreanNation": "호주",
          "flag": "🇦🇺"
        },
        {
          "id": 3962,
          "name": "Matt Targett",
          "backNumber": 23,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 190558,
          "name": "Nobel Mendy",
          "backNumber": 32,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        }
      ],
      "GK": [
        {
          "id": 3308,
          "name": "Jack Butland",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6300,
          "name": "Dillon Phillips",
          "backNumber": 12,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 170812,
          "name": "Konstantinos Tzolakis",
          "backNumber": 19,
          "position": "GK",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        }
      ]
    }
  },
  "12": {
    "teamId": 349,
    "apiTeamId": 349,
    "teamName": "Ipswich Town FC",
    "manager": {
      "name": "Gary O'Neil",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 187162,
          "name": "Abdul Issahaku",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 230057,
          "name": "Sindre Egeli",
          "backNumber": 8,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 67893,
          "name": "Zian Flemming",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 172632,
          "name": "Jaden Philogene-Bidace",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 176628,
          "name": "Emersonn",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 9053,
          "name": "Chuba Akpom",
          "backNumber": 29,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 44017,
          "name": "Daizen Maeda",
          "backNumber": 38,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 4158,
          "name": "Jack Clarke",
          "backNumber": 47,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7566,
          "name": "Azor Matusiwa",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 168949,
          "name": "Julio Enciso",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 37560,
          "name": "Florentino",
          "backNumber": 12,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 11720,
          "name": "Exequiel Palacios",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 5999,
          "name": "Jack Taylor",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 176777,
          "name": "Kasey McAteer",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 32938,
          "name": "Saša Lukić",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 140245,
          "name": "Marcelino Núñez",
          "backNumber": 32,
          "position": "MF",
          "nationality": "Chile",
          "koreanNation": "칠레",
          "flag": "🇨🇱"
        },
        {
          "id": 152437,
          "name": "Anis Mehmeti",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Albania",
          "koreanNation": "알바니아",
          "flag": "🇦🇱"
        }
      ],
      "DF": [
        {
          "id": 4017,
          "name": "Darnell Furlong",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99120,
          "name": "Leif Davis",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34871,
          "name": "Cédric Kipré",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 8296,
          "name": "Issa Diop",
          "backNumber": 14,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 125651,
          "name": "Jacob Greaves",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 270889,
          "name": "Abdoul Ouattara",
          "backNumber": 42,
          "position": "DF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        }
      ],
      "GK": [
        {
          "id": 8011,
          "name": "Alex Palmer",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3954,
          "name": "David Button",
          "backNumber": 27,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4867,
          "name": "Christian Walton",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 9814,
          "name": "Kjell Scherpen",
          "backNumber": 37,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ]
    }
  },
  "13": {
    "teamId": 341,
    "apiTeamId": 341,
    "teamName": "Leeds United FC",
    "manager": {
      "name": "Daniel Farke",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 7839,
          "name": "Dominic Calvert-Lewin",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 11777,
          "name": "Harry Wilson",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 7892,
          "name": "Lukas Nmecha",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 16058,
          "name": "Noah Okafor",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 7974,
          "name": "Daniel James",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 185882,
          "name": "Jean Bahoya",
          "backNumber": 23,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 7815,
          "name": "Ethan Ampadu",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 49105,
          "name": "Ao Tanaka",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 4955,
          "name": "Sean Longstaff",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 113262,
          "name": "Brenden Aaronson",
          "backNumber": 11,
          "position": "MF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 65843,
          "name": "Anton Stach",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 75284,
          "name": "Ilia Gruev",
          "backNumber": 44,
          "position": "MF",
          "nationality": "Bulgaria",
          "koreanNation": "불가리아",
          "flag": "🇧🇬"
        }
      ],
      "DF": [
        {
          "id": 4184,
          "name": "Jayden Bogle",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3475,
          "name": "Nico Elvedi",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 189153,
          "name": "Tarik Muharemović",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Bosnia-Herzegovina",
          "koreanNation": "보스니아",
          "flag": "🇧🇦"
        },
        {
          "id": 31531,
          "name": "Gabriel Gudmundsson",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 5714,
          "name": "Joe Rodon",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 74688,
          "name": "Jaka Bijol",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Slovenia",
          "koreanNation": "슬로베니아",
          "flag": "🇸🇮"
        },
        {
          "id": 5613,
          "name": "James Justin",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5315,
          "name": "Alex Cairns",
          "backNumber": 21,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 153874,
          "name": "James Trafford",
          "backNumber": 23,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "14": {
    "teamId": 64,
    "apiTeamId": 64,
    "teamName": "Liverpool FC",
    "manager": {
      "name": "Andoni Iraola",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 6486,
          "name": "Alexander Isak",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 7459,
          "name": "Cody Gakpo",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 1780,
          "name": "Federico Chiesa",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 152454,
          "name": "Hugo Ekitike",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 273423,
          "name": "Víctor Muñoz",
          "backNumber": 23,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 172762,
          "name": "Bradley Barcola",
          "backNumber": 29,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 273453,
          "name": "Rio Ngumoha",
          "backNumber": 73,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 3269,
          "name": "Wataru Endō",
          "backNumber": 3,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 81793,
          "name": "Ryan Gravenberch",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 16347,
          "name": "Dominik Szoboszlai",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 19334,
          "name": "Florian Wirtz",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 45681,
          "name": "Alexis Mac Allister",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 230517,
          "name": "Trey Nyoni",
          "backNumber": 42,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7862,
          "name": "Joe Gomez",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7869,
          "name": "Virgil van Dijk",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 206127,
          "name": "Jeremy Jacquet",
          "backNumber": 5,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 171141,
          "name": "Milos Kerkez",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 175865,
          "name": "Conor Bradley",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 192563,
          "name": "Giovanni Leoni",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 7383,
          "name": "Kostas Tsimikas",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 128954,
          "name": "Jeremie Frimpong",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 28292,
          "name": "Ronald Araújo",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        }
      ],
      "GK": [
        {
          "id": 1795,
          "name": "Alisson Becker",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 84506,
          "name": "Giorgi Mamardashvili",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Georgia",
          "koreanNation": "조지아",
          "flag": "🇬🇪"
        },
        {
          "id": 11629,
          "name": "Freddie Woodman",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 152579,
          "name": "Vítězslav Jaroš",
          "backNumber": 56,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 165154,
          "name": "Harvey Davies",
          "backNumber": 95,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "15": {
    "teamId": 65,
    "apiTeamId": 65,
    "teamName": "Manchester City FC",
    "manager": {
      "name": "Enzo Maresca",
      "role": "감독 (Head Coach)",
      "nationality": "Italy",
      "koreanNation": "이탈리아",
      "flag": "🇮🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 38101,
          "name": "Erling Haaland",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 99775,
          "name": "Jeremy Doku",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 94091,
          "name": "Iliman Ndiaye",
          "backNumber": 13,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 274216,
          "name": "Allan",
          "backNumber": 37,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 4417,
          "name": "Antoine Semenyo",
          "backNumber": 42,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 286950,
          "name": "Ryan McAidoo",
          "backNumber": 56,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 107330,
          "name": "Elliot Anderson",
          "backNumber": 5,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 65,
          "name": "Mateo Kovačić",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Croatia",
          "koreanNation": "크로아티아",
          "flag": "🇭🇷"
        },
        {
          "id": 102603,
          "name": "Enzo Fernández",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 133242,
          "name": "Rayan Cherki",
          "backNumber": 18,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 221819,
          "name": "Ayyoub Bouaddi",
          "backNumber": 32,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "DF": [
        {
          "id": 212868,
          "name": "Abdukodir Khusanov",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Uzbekistan",
          "koreanNation": "우즈베키스탄",
          "flag": "🇺🇿"
        },
        {
          "id": 10183,
          "name": "Rúben Dias",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 206743,
          "name": "Nico O'Reilly",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 91512,
          "name": "Matheus Nunes",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 249196,
          "name": "Vitor Reis",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 172791,
          "name": "Josh Wilson-Esbrand",
          "backNumber": 59,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 187202,
          "name": "Rico Lewis",
          "backNumber": 82,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 1731,
          "name": "Gianluigi Donnarumma",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 3953,
          "name": "Marcus Bettinelli",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6,
          "name": "Géronimo Rulli",
          "backNumber": 28,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        }
      ]
    }
  },
  "16": {
    "teamId": 66,
    "apiTeamId": 66,
    "teamName": "Manchester United FC",
    "manager": {
      "name": "Michael Carrick",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 30842,
          "name": "Matheus Cunha",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3331,
          "name": "Marcus Rashford",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99731,
          "name": "Joshua Zirkzee",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 211559,
          "name": "Patrick Dorgu",
          "backNumber": 13,
          "position": "FW",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 133584,
          "name": "Amad Diallo",
          "backNumber": 16,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 8626,
          "name": "Bryan Mbeumo",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Cameroon",
          "koreanNation": "카메룬",
          "flag": "🇨🇲"
        },
        {
          "id": 124244,
          "name": "Benjamin Šeško",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Slovenia",
          "koreanNation": "슬로베니아",
          "flag": "🇸🇮"
        },
        {
          "id": 289557,
          "name": "Shea Lacey",
          "backNumber": 31,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7599,
          "name": "Mason Mount",
          "backNumber": 7,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3257,
          "name": "Bruno Fernandes",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 3658,
          "name": "Youri Tielemans",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 190797,
          "name": "Kobbie Mainoo",
          "backNumber": 16,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 166366,
          "name": "Andrey Santos",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 178604,
          "name": "Carlos Baleba",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Cameroon",
          "koreanNation": "카메룬",
          "flag": "🇨🇲"
        },
        {
          "id": 28549,
          "name": "Manuel Ugarte",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        },
        {
          "id": 271941,
          "name": "Jack Fletcher",
          "backNumber": 38,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 290139,
          "name": "Tyler Fletcher",
          "backNumber": 39,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7553,
          "name": "Noussair Mazraoui",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 7549,
          "name": "Matthijs de Ligt",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 3326,
          "name": "Harry Maguire",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 15905,
          "name": "Diogo Dalot",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 46451,
          "name": "Lisandro Martínez",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 181933,
          "name": "Leny Yoro",
          "backNumber": 15,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 7898,
          "name": "Luke Shaw",
          "backNumber": 23,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 247644,
          "name": "Ayden Heaven",
          "backNumber": 26,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 210150,
          "name": "Harry Amass",
          "backNumber": 41,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 129946,
          "name": "Senne Lammens",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 7913,
          "name": "Karl Darlow",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 8035,
          "name": "Tom Heaton",
          "backNumber": 22,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 210730,
          "name": "Dermot Mee",
          "backNumber": 45,
          "position": "GK",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        }
      ]
    }
  },
  "17": {
    "teamId": 67,
    "apiTeamId": 67,
    "teamName": "Newcastle United FC",
    "manager": {
      "name": "Matthias Jaissle",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 8076,
          "name": "Harvey Barnes",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 169324,
          "name": "William Osula",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 166376,
          "name": "Anthony Elanga",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 249312,
          "name": "Bazoumana Touré",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 612,
          "name": "Yoane Wissa",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 213511,
          "name": "Matias Fernandez-Pardo",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 7934,
          "name": "Jacob Murphy",
          "backNumber": 23,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 171986,
          "name": "Nico Gonzalez",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 10653,
          "name": "Joelinton",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 272943,
          "name": "Aladji Bamba",
          "backNumber": 8,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 251265,
          "name": "Sean Steur",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 7798,
          "name": "Joe Willock",
          "backNumber": 28,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 111437,
          "name": "Jacob Ramsey",
          "backNumber": 41,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191939,
          "name": "Lewis Miley",
          "backNumber": 67,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 168712,
          "name": "Valentino Livramento",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191140,
          "name": "Lewis Hall",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 81082,
          "name": "Sven Botman",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 88,
          "name": "Fabian Schär",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 4870,
          "name": "Dan Burn",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 142732,
          "name": "Malick Thiaw",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 81816,
          "name": "Amar Dedić",
          "backNumber": 37,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 277574,
          "name": "Leo Shahar",
          "backNumber": 51,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 3310,
          "name": "Nick Pope",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 146753,
          "name": "Lukáš Horníček",
          "backNumber": 21,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 191388,
          "name": "Ewen Jaouen",
          "backNumber": 24,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 5048,
          "name": "Mark Gillespie",
          "backNumber": 29,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "18": {
    "teamId": 351,
    "apiTeamId": 351,
    "teamName": "Nottingham Forest FC",
    "manager": {
      "name": "Oliver Glasner",
      "role": "감독 (Head Coach)",
      "nationality": "Austria",
      "koreanNation": "오스트리아",
      "flag": "🇦🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 7816,
          "name": "Callum Hudson-Odoi",
          "backNumber": 7,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8057,
          "name": "Chris Wood",
          "backNumber": 9,
          "position": "FW",
          "nationality": "New Zealand",
          "koreanNation": "뉴질랜드",
          "flag": "🇳🇿"
        },
        {
          "id": 256339,
          "name": "Igor Jesus",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 77641,
          "name": "Dan Ndoye",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 130668,
          "name": "Arnaud Kalimuendo",
          "backNumber": 15,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 151095,
          "name": "Liam Delap",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 46346,
          "name": "Nicolás Domínguez",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 4091,
          "name": "Morgan Gibbs-White",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8307,
          "name": "Ibrahim Sangaré",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 16344,
          "name": "Xaver Schlager",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 5435,
          "name": "Ryan Yates",
          "backNumber": 22,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 172956,
          "name": "James McAtee",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 184747,
          "name": "Ousmane Diomande",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Cote d'Ivoire",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 133765,
          "name": "Neco Williams",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 192637,
          "name": "Murillo",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179782,
          "name": "Jair Paula",
          "backNumber": 23,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 144361,
          "name": "Luca Netz",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 22010,
          "name": "Daniel Muñoz",
          "backNumber": 27,
          "position": "DF",
          "nationality": "Colombia",
          "koreanNation": "콜롬비아",
          "flag": "🇨🇴"
        },
        {
          "id": 1775,
          "name": "Nikola Milenković",
          "backNumber": 31,
          "position": "DF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 3386,
          "name": "Ola Aina",
          "backNumber": 34,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 191730,
          "name": "Nicolò Savona",
          "backNumber": 37,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        }
      ],
      "GK": [
        {
          "id": 1299,
          "name": "John",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3643,
          "name": "Matz Sels",
          "backNumber": 26,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 81055,
          "name": "Steven Benda",
          "backNumber": 33,
          "position": "GK",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        }
      ]
    }
  },
  "19": {
    "teamId": 71,
    "apiTeamId": 71,
    "teamName": "Sunderland AFC",
    "manager": {
      "name": "Regis Le Bris",
      "role": "감독 (Head Coach)",
      "nationality": "France",
      "koreanNation": "프랑스",
      "flag": "🇫🇷"
    },
    "squad": {
      "FW": [
        {
          "id": 192313,
          "name": "Chemsdine Talbi",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 172275,
          "name": "Romaine Mundle",
          "backNumber": 14,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 83599,
          "name": "Wilson Isidor",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Haiti",
          "koreanNation": "아이티",
          "flag": "🇭🇹"
        },
        {
          "id": 97535,
          "name": "Brian Brobbey",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 187375,
          "name": "Nilson Angulo",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 290809,
          "name": "Jocelin Bi",
          "backNumber": 37,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        }
      ],
      "MF": [
        {
          "id": 11362,
          "name": "Alan Browne",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 3477,
          "name": "Granit Xhaka",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 99664,
          "name": "Enzo Le Fée",
          "backNumber": 10,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 190817,
          "name": "Chris Rigg",
          "backNumber": 11,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171876,
          "name": "Habib Diarra",
          "backNumber": 19,
          "position": "MF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 182273,
          "name": "Noah Sadiki",
          "backNumber": 27,
          "position": "MF",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 286011,
          "name": "Jules Ahoka",
          "backNumber": 29,
          "position": "MF",
          "nationality": "DR Congo",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 165311,
          "name": "Abdoullah Ba",
          "backNumber": 46,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "DF": [
        {
          "id": 6655,
          "name": "Kevin Danso",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 46491,
          "name": "Omar Alderete",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 121109,
          "name": "Daniel Ballard",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 264401,
          "name": "Dayann Methalie",
          "backNumber": 6,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 6259,
          "name": "Luke O'Nien",
          "backNumber": 13,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3650,
          "name": "Thomas Meunier",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 37094,
          "name": "Reinildo",
          "backNumber": 17,
          "position": "DF",
          "nationality": "Mozambique",
          "koreanNation": "모잠비크",
          "flag": "🇲🇿"
        },
        {
          "id": 8371,
          "name": "Nordi Mukiele",
          "backNumber": 20,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 117687,
          "name": "Trai Hume",
          "backNumber": 32,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 161270,
          "name": "Aji Alese",
          "backNumber": 42,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 137691,
          "name": "Robin Roefs",
          "backNumber": 13,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 4292,
          "name": "Simon Moore",
          "backNumber": 21,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 150893,
          "name": "Melker Ellborg",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        }
      ]
    }
  },
  "20": {
    "teamId": 73,
    "apiTeamId": 73,
    "teamName": "Tottenham Hotspur FC",
    "manager": {
      "name": "Roberto De Zerbi",
      "role": "감독 (Head Coach)",
      "nationality": "Italy",
      "koreanNation": "이탈리아",
      "flag": "🇮🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 8133,
          "name": "Richarlison",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 171977,
          "name": "Mathys Tel",
          "backNumber": 11,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 146352,
          "name": "Sávio",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 7878,
          "name": "Dominic Solanke",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 77399,
          "name": "Mohammed Kudus",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 66896,
          "name": "Omar Marmoush",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Egypt",
          "koreanNation": "이집트",
          "flag": "🇪🇬"
        },
        {
          "id": 98978,
          "name": "Mykhailo Mudryk",
          "backNumber": 27,
          "position": "FW",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        },
        {
          "id": 184999,
          "name": "Wilson Odobert",
          "backNumber": 28,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 2041,
          "name": "Rodrigo Bentancur",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        },
        {
          "id": 119265,
          "name": "Conor Gallagher",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3992,
          "name": "James Maddison",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 193622,
          "name": "Lucas Bergvall",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 2563,
          "name": "Sandro Tonali",
          "backNumber": 16,
          "position": "MF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 187216,
          "name": "Mateus Fernandes",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 1859,
          "name": "Dejan Kulusevski",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        }
      ],
      "DF": [
        {
          "id": 7868,
          "name": "Andrew Robertson",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 7880,
          "name": "Tosin Adarabioyo",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7994,
          "name": "Ben Davies",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 46046,
          "name": "Marcos Senesi",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 98566,
          "name": "Jan Paul van Hecke",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 81037,
          "name": "Pedro Porro",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 177040,
          "name": "Archie Gray",
          "backNumber": 14,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 131177,
          "name": "Mickey van de Ven",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ],
      "GK": [
        {
          "id": 255239,
          "name": "Antonín Kinský",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 7914,
          "name": "Martin Dúbravka",
          "backNumber": 39,
          "position": "GK",
          "nationality": "Slovakia",
          "koreanNation": "슬로바키아",
          "flag": "🇸🇰"
        },
        {
          "id": 133229,
          "name": "Brandon Austin",
          "backNumber": 40,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "57": {
    "teamId": 57,
    "apiTeamId": 57,
    "teamName": "Arsenal FC",
    "manager": {
      "name": "Mikel Arteta",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 171,
          "name": "Kai Havertz",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 99813,
          "name": "Bukayo Saka",
          "backNumber": 7,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8279,
          "name": "Viktor Gyökeres",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 144434,
          "name": "Christos Tzolis",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 167720,
          "name": "Noni Madueke",
          "backNumber": 20,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 285128,
          "name": "Max Dowman",
          "backNumber": 56,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 8215,
          "name": "Declan Rice",
          "backNumber": 4,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7935,
          "name": "Mikel Merino",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 7427,
          "name": "Martin Ødegaard",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 115035,
          "name": "Martín Zubimendi",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 4032,
          "name": "Eberechi Eze",
          "backNumber": 21,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 1684,
          "name": "Bruno Guimarães",
          "backNumber": 39,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "DF": [
        {
          "id": 98816,
          "name": "Jurrien Timber",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 23128,
          "name": "Gabriel Magalhães",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 172839,
          "name": "Cristhian Mosquera",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 6154,
          "name": "Ben White",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 125674,
          "name": "Piero Hincapié",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 6317,
          "name": "Ezri Konsa",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 80171,
          "name": "William Saliba",
          "backNumber": 17,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 133512,
          "name": "Riccardo Calafiori",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 244120,
          "name": "Myles Lewis-Skelly",
          "backNumber": 49,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 4832,
          "name": "David Raya",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 3189,
          "name": "Kepa Arrizabalaga",
          "backNumber": 13,
          "position": "GK",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 74831,
          "name": "Illan Meslier",
          "backNumber": 30,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ]
    }
  },
  "58": {
    "teamId": 58,
    "apiTeamId": 58,
    "teamName": "Aston Villa FC",
    "manager": {
      "name": "Unai Emery",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 152515,
          "name": "Nicolas Jackson",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 181901,
          "name": "Alejandro Garnacho",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 7985,
          "name": "Tammy Abraham",
          "backNumber": 18,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 265040,
          "name": "Ibrahim M'Baye",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 280446,
          "name": "Brian Madjo",
          "backNumber": 39,
          "position": "FW",
          "nationality": "Luxembourg",
          "koreanNation": "룩셈부르크",
          "flag": "🇱🇺"
        },
        {
          "id": 260718,
          "name": "Alysson",
          "backNumber": 47,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 289528,
          "name": "George Hemmings",
          "backNumber": 53,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7817,
          "name": "Ross Barkley",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34646,
          "name": "John McGinn",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 3181,
          "name": "Leon Goretzka",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 8346,
          "name": "Boubacar Kamara",
          "backNumber": 8,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 212309,
          "name": "Johan Manzambi",
          "backNumber": 9,
          "position": "MF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 31941,
          "name": "Emiliano Buendía",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 114024,
          "name": "Amadou Onana",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 172899,
          "name": "Lamare Bogarde",
          "backNumber": 26,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 138034,
          "name": "João Gomes",
          "backNumber": 35,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "DF": [
        {
          "id": 11644,
          "name": "Matty Cash",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Poland",
          "koreanNation": "폴란드",
          "flag": "🇵🇱"
        },
        {
          "id": 3492,
          "name": "Victor Nilsson-Lindelöf",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 131035,
          "name": "Taylor Harwood-Bellis",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8235,
          "name": "Tyrone Mings",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 151241,
          "name": "Matteo Ruggeri",
          "backNumber": 13,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 33109,
          "name": "Pau Torres",
          "backNumber": 14,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 131120,
          "name": "Ian Maatsen",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 8158,
          "name": "Aaron Wan-Bissaka",
          "backNumber": 29,
          "position": "DF",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 276000,
          "name": "Modou Keba Cisse",
          "backNumber": 48,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        }
      ],
      "GK": [
        {
          "id": 118920,
          "name": "Zion Suzuki",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 7675,
          "name": "Marco Bizot",
          "backNumber": 40,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ]
    }
  },
  "61": {
    "teamId": 61,
    "apiTeamId": 61,
    "teamName": "Chelsea FC",
    "manager": {
      "name": "Xavi Alonso",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 103125,
          "name": "João Pedro",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179460,
          "name": "Jamie Bynoe-Gittens",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 2074,
          "name": "Pedro Neto",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 3328,
          "name": "Danny Welbeck",
          "backNumber": 18,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 150599,
          "name": "Emanuel Emegha",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 229421,
          "name": "Geovany Quenda",
          "backNumber": 23,
          "position": "FW",
          "nationality": "Guinea-Bissau",
          "koreanNation": "기니비사우",
          "flag": "🇬🇼"
        },
        {
          "id": 244778,
          "name": "Estevao",
          "backNumber": 41,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        }
      ],
      "MF": [
        {
          "id": 170261,
          "name": "Valentin Barco",
          "backNumber": 4,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 205684,
          "name": "Ray Paez",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 144892,
          "name": "Cole Palmer",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3320,
          "name": "Jordan Henderson",
          "backNumber": 14,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82140,
          "name": "Morgan Rogers",
          "backNumber": 17,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 121103,
          "name": "Moisés Caicedo",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 172738,
          "name": "Romeo Lavia",
          "backNumber": 45,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "DF": [
        {
          "id": 152498,
          "name": "Malo Gusto",
          "backNumber": 2,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 206136,
          "name": "Marco Palestra",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 8545,
          "name": "Wesley Fofana",
          "backNumber": 3,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 170440,
          "name": "Levi Colwill",
          "backNumber": 6,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 56628,
          "name": "Reece James",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 189477,
          "name": "Jorrel Hato",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 82351,
          "name": "Maxence Lacroix",
          "backNumber": 26,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 151251,
          "name": "Pep Chavarría",
          "backNumber": 29,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 209148,
          "name": "Aaron Anselmino",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 249320,
          "name": "Josh Acheampong",
          "backNumber": 34,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 3141,
          "name": "Emiliano Martínez",
          "backNumber": 23,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 175910,
          "name": "Teddy Sharman-Lowe",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191068,
          "name": "Mike Penders",
          "backNumber": 39,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 137544,
          "name": "Gabriel Slonina",
          "backNumber": 44,
          "position": "GK",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        }
      ]
    }
  },
  "62": {
    "teamId": 62,
    "apiTeamId": 62,
    "teamName": "Everton FC",
    "manager": {
      "name": "David Moyes",
      "role": "감독 (Head Coach)",
      "nationality": "Scotland",
      "koreanNation": "스코틀랜드",
      "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
    },
    "squad": {
      "FW": [
        {
          "id": 3895,
          "name": "Jack Grealish",
          "backNumber": 10,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171995,
          "name": "Thierno Barry",
          "backNumber": 11,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 250436,
          "name": "Tyrique George",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 218525,
          "name": "Tyler Dibling",
          "backNumber": 20,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 124694,
          "name": "Brennan Johnson",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        }
      ],
      "MF": [
        {
          "id": 140194,
          "name": "Kiernan Dewsbury Hall",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24102,
          "name": "Christian Nørgaard",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 140269,
          "name": "Carlos Alcaraz",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 136284,
          "name": "Hayden Hackney",
          "backNumber": 30,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 156552,
          "name": "Merlin Röhl",
          "backNumber": 34,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 101076,
          "name": "James Garner",
          "backNumber": 37,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 264281,
          "name": "Harrison Armstrong",
          "backNumber": 45,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7792,
          "name": "Ainsley Maitland-Niles",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 114120,
          "name": "Jarrad Branthwaite",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7829,
          "name": "Michael Keane",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3316,
          "name": "James Tarkowski",
          "backNumber": 6,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 131569,
          "name": "Jake O'Brien",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 16165,
          "name": "Vitalii Mykolenko",
          "backNumber": 16,
          "position": "DF",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        }
      ],
      "GK": [
        {
          "id": 3309,
          "name": "Jordan Pickford",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82135,
          "name": "Mark Travers",
          "backNumber": 23,
          "position": "GK",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 6180,
          "name": "Thomas King",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        }
      ]
    }
  },
  "63": {
    "teamId": 63,
    "apiTeamId": 63,
    "teamName": "Fulham FC",
    "manager": {
      "name": "Álvaro Arbeloa",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 217658,
          "name": "Gonzalo García",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 138036,
          "name": "Rodrigo Muniz",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179122,
          "name": "Kevin Santos",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3392,
          "name": "Alex Iwobi",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 217577,
          "name": "Jonah Kusi-Asare",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 179716,
          "name": "Oscar Bobb",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        }
      ],
      "MF": [
        {
          "id": 3995,
          "name": "Harrison Reed",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 290848,
          "name": "César Palacios",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 8973,
          "name": "Sander Berge",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 3965,
          "name": "Tom Cairney",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 180563,
          "name": "Hugo Larsson",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 192108,
          "name": "Shea Charles",
          "backNumber": 19,
          "position": "MF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 291727,
          "name": "Manuel Angel",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 246418,
          "name": "Joshua King",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 85570,
          "name": "Emile Smith Rowe",
          "backNumber": 32,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 2253,
          "name": "Joachim Andersen",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 8460,
          "name": "Kenny Tete",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 146154,
          "name": "Calvin Bassey",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 98750,
          "name": "Jorge Cuenca",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 3927,
          "name": "Antonee Robinson",
          "backNumber": 5,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 1836,
          "name": "Timothy Castagne",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 123212,
          "name": "David Affengruber",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 3959,
          "name": "Ryan Sessegnon",
          "backNumber": 30,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 217596,
          "name": "Luc De Fougerolles",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        }
      ],
      "GK": [
        {
          "id": 3174,
          "name": "Bernd Leno",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 8366,
          "name": "Benjamin Lecomte",
          "backNumber": 23,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 300279,
          "name": "Alex Borto",
          "backNumber": 36,
          "position": "GK",
          "nationality": "United States",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        }
      ]
    }
  },
  "64": {
    "teamId": 64,
    "apiTeamId": 64,
    "teamName": "Liverpool FC",
    "manager": {
      "name": "Andoni Iraola",
      "role": "감독 (Head Coach)",
      "nationality": "Spain",
      "koreanNation": "스페인",
      "flag": "🇪🇸"
    },
    "squad": {
      "FW": [
        {
          "id": 6486,
          "name": "Alexander Isak",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 7459,
          "name": "Cody Gakpo",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 1780,
          "name": "Federico Chiesa",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 152454,
          "name": "Hugo Ekitike",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 273423,
          "name": "Víctor Muñoz",
          "backNumber": 23,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 172762,
          "name": "Bradley Barcola",
          "backNumber": 29,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 273453,
          "name": "Rio Ngumoha",
          "backNumber": 73,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 3269,
          "name": "Wataru Endō",
          "backNumber": 3,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 81793,
          "name": "Ryan Gravenberch",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 16347,
          "name": "Dominik Szoboszlai",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 19334,
          "name": "Florian Wirtz",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 45681,
          "name": "Alexis Mac Allister",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 230517,
          "name": "Trey Nyoni",
          "backNumber": 42,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7862,
          "name": "Joe Gomez",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7869,
          "name": "Virgil van Dijk",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 206127,
          "name": "Jeremy Jacquet",
          "backNumber": 5,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 171141,
          "name": "Milos Kerkez",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 175865,
          "name": "Conor Bradley",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 192563,
          "name": "Giovanni Leoni",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 7383,
          "name": "Kostas Tsimikas",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 128954,
          "name": "Jeremie Frimpong",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 28292,
          "name": "Ronald Araújo",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        }
      ],
      "GK": [
        {
          "id": 1795,
          "name": "Alisson Becker",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 84506,
          "name": "Giorgi Mamardashvili",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Georgia",
          "koreanNation": "조지아",
          "flag": "🇬🇪"
        },
        {
          "id": 11629,
          "name": "Freddie Woodman",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 152579,
          "name": "Vítězslav Jaroš",
          "backNumber": 56,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 165154,
          "name": "Harvey Davies",
          "backNumber": 95,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "65": {
    "teamId": 65,
    "apiTeamId": 65,
    "teamName": "Manchester City FC",
    "manager": {
      "name": "Enzo Maresca",
      "role": "감독 (Head Coach)",
      "nationality": "Italy",
      "koreanNation": "이탈리아",
      "flag": "🇮🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 38101,
          "name": "Erling Haaland",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 99775,
          "name": "Jeremy Doku",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 94091,
          "name": "Iliman Ndiaye",
          "backNumber": 13,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 274216,
          "name": "Allan",
          "backNumber": 37,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 4417,
          "name": "Antoine Semenyo",
          "backNumber": 42,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 286950,
          "name": "Ryan McAidoo",
          "backNumber": 56,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 107330,
          "name": "Elliot Anderson",
          "backNumber": 5,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 65,
          "name": "Mateo Kovačić",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Croatia",
          "koreanNation": "크로아티아",
          "flag": "🇭🇷"
        },
        {
          "id": 102603,
          "name": "Enzo Fernández",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 133242,
          "name": "Rayan Cherki",
          "backNumber": 18,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 221819,
          "name": "Ayyoub Bouaddi",
          "backNumber": 32,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "DF": [
        {
          "id": 212868,
          "name": "Abdukodir Khusanov",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Uzbekistan",
          "koreanNation": "우즈베키스탄",
          "flag": "🇺🇿"
        },
        {
          "id": 10183,
          "name": "Rúben Dias",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 206743,
          "name": "Nico O'Reilly",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 91512,
          "name": "Matheus Nunes",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 249196,
          "name": "Vitor Reis",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 172791,
          "name": "Josh Wilson-Esbrand",
          "backNumber": 59,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 187202,
          "name": "Rico Lewis",
          "backNumber": 82,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 1731,
          "name": "Gianluigi Donnarumma",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 3953,
          "name": "Marcus Bettinelli",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6,
          "name": "Géronimo Rulli",
          "backNumber": 28,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        }
      ]
    }
  },
  "66": {
    "teamId": 66,
    "apiTeamId": 66,
    "teamName": "Manchester United FC",
    "manager": {
      "name": "Michael Carrick",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 30842,
          "name": "Matheus Cunha",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3331,
          "name": "Marcus Rashford",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99731,
          "name": "Joshua Zirkzee",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 211559,
          "name": "Patrick Dorgu",
          "backNumber": 13,
          "position": "FW",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 133584,
          "name": "Amad Diallo",
          "backNumber": 16,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 8626,
          "name": "Bryan Mbeumo",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Cameroon",
          "koreanNation": "카메룬",
          "flag": "🇨🇲"
        },
        {
          "id": 124244,
          "name": "Benjamin Šeško",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Slovenia",
          "koreanNation": "슬로베니아",
          "flag": "🇸🇮"
        },
        {
          "id": 289557,
          "name": "Shea Lacey",
          "backNumber": 31,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7599,
          "name": "Mason Mount",
          "backNumber": 7,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3257,
          "name": "Bruno Fernandes",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 3658,
          "name": "Youri Tielemans",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 190797,
          "name": "Kobbie Mainoo",
          "backNumber": 16,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 166366,
          "name": "Andrey Santos",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 178604,
          "name": "Carlos Baleba",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Cameroon",
          "koreanNation": "카메룬",
          "flag": "🇨🇲"
        },
        {
          "id": 28549,
          "name": "Manuel Ugarte",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        },
        {
          "id": 271941,
          "name": "Jack Fletcher",
          "backNumber": 38,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 290139,
          "name": "Tyler Fletcher",
          "backNumber": 39,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 7553,
          "name": "Noussair Mazraoui",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 7549,
          "name": "Matthijs de Ligt",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 3326,
          "name": "Harry Maguire",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 15905,
          "name": "Diogo Dalot",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 46451,
          "name": "Lisandro Martínez",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 181933,
          "name": "Leny Yoro",
          "backNumber": 15,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 7898,
          "name": "Luke Shaw",
          "backNumber": 23,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 247644,
          "name": "Ayden Heaven",
          "backNumber": 26,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 210150,
          "name": "Harry Amass",
          "backNumber": 41,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 129946,
          "name": "Senne Lammens",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 7913,
          "name": "Karl Darlow",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 8035,
          "name": "Tom Heaton",
          "backNumber": 22,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 210730,
          "name": "Dermot Mee",
          "backNumber": 45,
          "position": "GK",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        }
      ]
    }
  },
  "67": {
    "teamId": 67,
    "apiTeamId": 67,
    "teamName": "Newcastle United FC",
    "manager": {
      "name": "Matthias Jaissle",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 8076,
          "name": "Harvey Barnes",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 169324,
          "name": "William Osula",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 166376,
          "name": "Anthony Elanga",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 249312,
          "name": "Bazoumana Touré",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 612,
          "name": "Yoane Wissa",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 213511,
          "name": "Matias Fernandez-Pardo",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 7934,
          "name": "Jacob Murphy",
          "backNumber": 23,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 171986,
          "name": "Nico Gonzalez",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 10653,
          "name": "Joelinton",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 272943,
          "name": "Aladji Bamba",
          "backNumber": 8,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 251265,
          "name": "Sean Steur",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 7798,
          "name": "Joe Willock",
          "backNumber": 28,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 111437,
          "name": "Jacob Ramsey",
          "backNumber": 41,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191939,
          "name": "Lewis Miley",
          "backNumber": 67,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 168712,
          "name": "Valentino Livramento",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191140,
          "name": "Lewis Hall",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 81082,
          "name": "Sven Botman",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 88,
          "name": "Fabian Schär",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 4870,
          "name": "Dan Burn",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 142732,
          "name": "Malick Thiaw",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 81816,
          "name": "Amar Dedić",
          "backNumber": 37,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 277574,
          "name": "Leo Shahar",
          "backNumber": 51,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 3310,
          "name": "Nick Pope",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 146753,
          "name": "Lukáš Horníček",
          "backNumber": 21,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 191388,
          "name": "Ewen Jaouen",
          "backNumber": 24,
          "position": "GK",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 5048,
          "name": "Mark Gillespie",
          "backNumber": 29,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "71": {
    "teamId": 71,
    "apiTeamId": 71,
    "teamName": "Sunderland AFC",
    "manager": {
      "name": "Regis Le Bris",
      "role": "감독 (Head Coach)",
      "nationality": "France",
      "koreanNation": "프랑스",
      "flag": "🇫🇷"
    },
    "squad": {
      "FW": [
        {
          "id": 192313,
          "name": "Chemsdine Talbi",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 172275,
          "name": "Romaine Mundle",
          "backNumber": 14,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 83599,
          "name": "Wilson Isidor",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Haiti",
          "koreanNation": "아이티",
          "flag": "🇭🇹"
        },
        {
          "id": 97535,
          "name": "Brian Brobbey",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 187375,
          "name": "Nilson Angulo",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 290809,
          "name": "Jocelin Bi",
          "backNumber": 37,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        }
      ],
      "MF": [
        {
          "id": 11362,
          "name": "Alan Browne",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 3477,
          "name": "Granit Xhaka",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 99664,
          "name": "Enzo Le Fée",
          "backNumber": 10,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 190817,
          "name": "Chris Rigg",
          "backNumber": 11,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171876,
          "name": "Habib Diarra",
          "backNumber": 19,
          "position": "MF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 182273,
          "name": "Noah Sadiki",
          "backNumber": 27,
          "position": "MF",
          "nationality": "Congo DR",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 286011,
          "name": "Jules Ahoka",
          "backNumber": 29,
          "position": "MF",
          "nationality": "DR Congo",
          "koreanNation": "콩고",
          "flag": "🇨🇩"
        },
        {
          "id": 165311,
          "name": "Abdoullah Ba",
          "backNumber": 46,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "DF": [
        {
          "id": 6655,
          "name": "Kevin Danso",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 46491,
          "name": "Omar Alderete",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 121109,
          "name": "Daniel Ballard",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 264401,
          "name": "Dayann Methalie",
          "backNumber": 6,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 6259,
          "name": "Luke O'Nien",
          "backNumber": 13,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3650,
          "name": "Thomas Meunier",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 37094,
          "name": "Reinildo",
          "backNumber": 17,
          "position": "DF",
          "nationality": "Mozambique",
          "koreanNation": "모잠비크",
          "flag": "🇲🇿"
        },
        {
          "id": 8371,
          "name": "Nordi Mukiele",
          "backNumber": 20,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 117687,
          "name": "Trai Hume",
          "backNumber": 32,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 161270,
          "name": "Aji Alese",
          "backNumber": 42,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 137691,
          "name": "Robin Roefs",
          "backNumber": 13,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 4292,
          "name": "Simon Moore",
          "backNumber": 21,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 150893,
          "name": "Melker Ellborg",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        }
      ]
    }
  },
  "73": {
    "teamId": 73,
    "apiTeamId": 73,
    "teamName": "Tottenham Hotspur FC",
    "manager": {
      "name": "Roberto De Zerbi",
      "role": "감독 (Head Coach)",
      "nationality": "Italy",
      "koreanNation": "이탈리아",
      "flag": "🇮🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 8133,
          "name": "Richarlison",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 171977,
          "name": "Mathys Tel",
          "backNumber": 11,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 146352,
          "name": "Sávio",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 7878,
          "name": "Dominic Solanke",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 77399,
          "name": "Mohammed Kudus",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 66896,
          "name": "Omar Marmoush",
          "backNumber": 22,
          "position": "FW",
          "nationality": "Egypt",
          "koreanNation": "이집트",
          "flag": "🇪🇬"
        },
        {
          "id": 98978,
          "name": "Mykhailo Mudryk",
          "backNumber": 27,
          "position": "FW",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        },
        {
          "id": 184999,
          "name": "Wilson Odobert",
          "backNumber": 28,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 2041,
          "name": "Rodrigo Bentancur",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Uruguay",
          "koreanNation": "우루과이",
          "flag": "🇺🇾"
        },
        {
          "id": 119265,
          "name": "Conor Gallagher",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3992,
          "name": "James Maddison",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 193622,
          "name": "Lucas Bergvall",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 2563,
          "name": "Sandro Tonali",
          "backNumber": 16,
          "position": "MF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 187216,
          "name": "Mateus Fernandes",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 1859,
          "name": "Dejan Kulusevski",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        }
      ],
      "DF": [
        {
          "id": 7868,
          "name": "Andrew Robertson",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 7880,
          "name": "Tosin Adarabioyo",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7994,
          "name": "Ben Davies",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 46046,
          "name": "Marcos Senesi",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 98566,
          "name": "Jan Paul van Hecke",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 81037,
          "name": "Pedro Porro",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 177040,
          "name": "Archie Gray",
          "backNumber": 14,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 131177,
          "name": "Mickey van de Ven",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ],
      "GK": [
        {
          "id": 255239,
          "name": "Antonín Kinský",
          "backNumber": 31,
          "position": "GK",
          "nationality": "Czech Republic",
          "koreanNation": "체코",
          "flag": "🇨🇿"
        },
        {
          "id": 7914,
          "name": "Martin Dúbravka",
          "backNumber": 39,
          "position": "GK",
          "nationality": "Slovakia",
          "koreanNation": "슬로바키아",
          "flag": "🇸🇰"
        },
        {
          "id": 133229,
          "name": "Brandon Austin",
          "backNumber": 40,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "322": {
    "teamId": 322,
    "apiTeamId": 322,
    "teamName": "Hull City AFC",
    "manager": {
      "name": "Sergej Jakirovic",
      "role": "감독 (Head Coach)",
      "nationality": "Bosnia and Herzegovina",
      "koreanNation": "보스니아",
      "flag": "🇧🇦"
    },
    "squad": {
      "FW": [
        {
          "id": 26444,
          "name": "Sorba Thomas",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 4359,
          "name": "Oliver McBurnie",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 213072,
          "name": "Mohamed Belloumi",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Algeria",
          "koreanNation": "알제리",
          "flag": "🇩🇿"
        },
        {
          "id": 80761,
          "name": "Joe Gelhardt",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 110807,
          "name": "Liam Millar",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 192811,
          "name": "Elliot Stroud",
          "backNumber": 21,
          "position": "FW",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 170777,
          "name": "David Akintola",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 149129,
          "name": "Mohamed Ali Cho",
          "backNumber": 50,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 49092,
          "name": "Hidemasa Morita",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 147914,
          "name": "Eliot Matazo",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 193627,
          "name": "Jens Hjertö-Dahl",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 230388,
          "name": "Óscar Zambrano",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Ecuador",
          "koreanNation": "에콰도르",
          "flag": "🇪🇨"
        },
        {
          "id": 184963,
          "name": "Darko Gyabi",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6357,
          "name": "Matty Crooks",
          "backNumber": 25,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 11306,
          "name": "Kieran Dowell",
          "backNumber": 26,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4309,
          "name": "Regan Slater",
          "backNumber": 27,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 179603,
          "name": "Lucas Gourna-Douath",
          "backNumber": 29,
          "position": "MF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 30298,
          "name": "Abdülkadir Ömür",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Turkey",
          "koreanNation": "튀르키예",
          "flag": "🇹🇷"
        },
        {
          "id": 169326,
          "name": "Tim Iroegbunam",
          "backNumber": 42,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 5322,
          "name": "Lewie Coyle",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 82148,
          "name": "Ryan John Giles",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 189278,
          "name": "Charlie Hughes",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6451,
          "name": "Semi Ajayi",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 4425,
          "name": "John Egan",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 4058,
          "name": "Paddy McNair",
          "backNumber": 17,
          "position": "DF",
          "nationality": "Northern Ireland",
          "koreanNation": "북아일랜드",
          "flag": "🇬🇧"
        },
        {
          "id": 270733,
          "name": "Lucas Herrington",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Australia",
          "koreanNation": "호주",
          "flag": "🇦🇺"
        },
        {
          "id": 3962,
          "name": "Matt Targett",
          "backNumber": 23,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 190558,
          "name": "Nobel Mendy",
          "backNumber": 32,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        }
      ],
      "GK": [
        {
          "id": 3308,
          "name": "Jack Butland",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6300,
          "name": "Dillon Phillips",
          "backNumber": 12,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 170812,
          "name": "Konstantinos Tzolakis",
          "backNumber": 19,
          "position": "GK",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        }
      ]
    }
  },
  "341": {
    "teamId": 341,
    "apiTeamId": 341,
    "teamName": "Leeds United FC",
    "manager": {
      "name": "Daniel Farke",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 7839,
          "name": "Dominic Calvert-Lewin",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 11777,
          "name": "Harry Wilson",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 7892,
          "name": "Lukas Nmecha",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 16058,
          "name": "Noah Okafor",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 7974,
          "name": "Daniel James",
          "backNumber": 20,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 185882,
          "name": "Jean Bahoya",
          "backNumber": 23,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        }
      ],
      "MF": [
        {
          "id": 7815,
          "name": "Ethan Ampadu",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 49105,
          "name": "Ao Tanaka",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 4955,
          "name": "Sean Longstaff",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 113262,
          "name": "Brenden Aaronson",
          "backNumber": 11,
          "position": "MF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 65843,
          "name": "Anton Stach",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 75284,
          "name": "Ilia Gruev",
          "backNumber": 44,
          "position": "MF",
          "nationality": "Bulgaria",
          "koreanNation": "불가리아",
          "flag": "🇧🇬"
        }
      ],
      "DF": [
        {
          "id": 4184,
          "name": "Jayden Bogle",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3475,
          "name": "Nico Elvedi",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 189153,
          "name": "Tarik Muharemović",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Bosnia-Herzegovina",
          "koreanNation": "보스니아",
          "flag": "🇧🇦"
        },
        {
          "id": 31531,
          "name": "Gabriel Gudmundsson",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 5714,
          "name": "Joe Rodon",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 74688,
          "name": "Jaka Bijol",
          "backNumber": 15,
          "position": "DF",
          "nationality": "Slovenia",
          "koreanNation": "슬로베니아",
          "flag": "🇸🇮"
        },
        {
          "id": 5613,
          "name": "James Justin",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5315,
          "name": "Alex Cairns",
          "backNumber": 21,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 153874,
          "name": "James Trafford",
          "backNumber": 23,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "349": {
    "teamId": 349,
    "apiTeamId": 349,
    "teamName": "Ipswich Town FC",
    "manager": {
      "name": "Gary O'Neil",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 187162,
          "name": "Abdul Issahaku",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 230057,
          "name": "Sindre Egeli",
          "backNumber": 8,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 67893,
          "name": "Zian Flemming",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 172632,
          "name": "Jaden Philogene-Bidace",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 176628,
          "name": "Emersonn",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 9053,
          "name": "Chuba Akpom",
          "backNumber": 29,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 44017,
          "name": "Daizen Maeda",
          "backNumber": 38,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 4158,
          "name": "Jack Clarke",
          "backNumber": 47,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 7566,
          "name": "Azor Matusiwa",
          "backNumber": 5,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 168949,
          "name": "Julio Enciso",
          "backNumber": 10,
          "position": "MF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 37560,
          "name": "Florentino",
          "backNumber": 12,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 11720,
          "name": "Exequiel Palacios",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 5999,
          "name": "Jack Taylor",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 176777,
          "name": "Kasey McAteer",
          "backNumber": 20,
          "position": "MF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 32938,
          "name": "Saša Lukić",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 140245,
          "name": "Marcelino Núñez",
          "backNumber": 32,
          "position": "MF",
          "nationality": "Chile",
          "koreanNation": "칠레",
          "flag": "🇨🇱"
        },
        {
          "id": 152437,
          "name": "Anis Mehmeti",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Albania",
          "koreanNation": "알바니아",
          "flag": "🇦🇱"
        }
      ],
      "DF": [
        {
          "id": 4017,
          "name": "Darnell Furlong",
          "backNumber": 2,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99120,
          "name": "Leif Davis",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34871,
          "name": "Cédric Kipré",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 8296,
          "name": "Issa Diop",
          "backNumber": 14,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 125651,
          "name": "Jacob Greaves",
          "backNumber": 24,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 270889,
          "name": "Abdoul Ouattara",
          "backNumber": 42,
          "position": "DF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        }
      ],
      "GK": [
        {
          "id": 8011,
          "name": "Alex Palmer",
          "backNumber": 1,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 3954,
          "name": "David Button",
          "backNumber": 27,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4867,
          "name": "Christian Walton",
          "backNumber": 28,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 9814,
          "name": "Kjell Scherpen",
          "backNumber": 37,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ]
    }
  },
  "351": {
    "teamId": 351,
    "apiTeamId": 351,
    "teamName": "Nottingham Forest FC",
    "manager": {
      "name": "Oliver Glasner",
      "role": "감독 (Head Coach)",
      "nationality": "Austria",
      "koreanNation": "오스트리아",
      "flag": "🇦🇹"
    },
    "squad": {
      "FW": [
        {
          "id": 7816,
          "name": "Callum Hudson-Odoi",
          "backNumber": 7,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8057,
          "name": "Chris Wood",
          "backNumber": 9,
          "position": "FW",
          "nationality": "New Zealand",
          "koreanNation": "뉴질랜드",
          "flag": "🇳🇿"
        },
        {
          "id": 256339,
          "name": "Igor Jesus",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 77641,
          "name": "Dan Ndoye",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 130668,
          "name": "Arnaud Kalimuendo",
          "backNumber": 15,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 151095,
          "name": "Liam Delap",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 46346,
          "name": "Nicolás Domínguez",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 4091,
          "name": "Morgan Gibbs-White",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8307,
          "name": "Ibrahim Sangaré",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 16344,
          "name": "Xaver Schlager",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 5435,
          "name": "Ryan Yates",
          "backNumber": 22,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 172956,
          "name": "James McAtee",
          "backNumber": 24,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 184747,
          "name": "Ousmane Diomande",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Cote d'Ivoire",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 133765,
          "name": "Neco Williams",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 192637,
          "name": "Murillo",
          "backNumber": 5,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 179782,
          "name": "Jair Paula",
          "backNumber": 23,
          "position": "DF",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 144361,
          "name": "Luca Netz",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 22010,
          "name": "Daniel Muñoz",
          "backNumber": 27,
          "position": "DF",
          "nationality": "Colombia",
          "koreanNation": "콜롬비아",
          "flag": "🇨🇴"
        },
        {
          "id": 1775,
          "name": "Nikola Milenković",
          "backNumber": 31,
          "position": "DF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 3386,
          "name": "Ola Aina",
          "backNumber": 34,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 191730,
          "name": "Nicolò Savona",
          "backNumber": 37,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        }
      ],
      "GK": [
        {
          "id": 1299,
          "name": "John",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 3643,
          "name": "Matz Sels",
          "backNumber": 26,
          "position": "GK",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        },
        {
          "id": 81055,
          "name": "Steven Benda",
          "backNumber": 33,
          "position": "GK",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        }
      ]
    }
  },
  "354": {
    "teamId": 354,
    "apiTeamId": 354,
    "teamName": "Crystal Palace FC",
    "manager": {
      "name": "Pierre Sage",
      "role": "감독 (Head Coach)",
      "nationality": "France",
      "koreanNation": "프랑스",
      "flag": "🇫🇷"
    },
    "squad": {
      "FW": [
        {
          "id": 7800,
          "name": "Eddie Nketiah",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 152505,
          "name": "Yeremi Pino",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 11623,
          "name": "Dwight McNeil",
          "backNumber": 11,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 213269,
          "name": "Jørgen Strand Larsen",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 224618,
          "name": "Zavier Gozo",
          "backNumber": 12,
          "position": "FW",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 3638,
          "name": "Ismaïla Sarr",
          "backNumber": 18,
          "position": "FW",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 641,
          "name": "Jean-Philippe Mateta",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 179319,
          "name": "Darío Osorio",
          "backNumber": 24,
          "position": "FW",
          "nationality": "Chile",
          "koreanNation": "칠레",
          "flag": "🇨🇱"
        },
        {
          "id": 176241,
          "name": "Matheus Franca",
          "backNumber": 27,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 128710,
          "name": "Evann Guessand",
          "backNumber": 29,
          "position": "FW",
          "nationality": "Ivory Coast",
          "koreanNation": "코트디부아르",
          "flag": "🇨🇮"
        },
        {
          "id": 179712,
          "name": "Jesurun Rak-Sakyi",
          "backNumber": 49,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "MF": [
        {
          "id": 3737,
          "name": "Jefferson Lerma",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Colombia",
          "koreanNation": "콜롬비아",
          "flag": "🇨🇴"
        },
        {
          "id": 6716,
          "name": "Daichi Kamada",
          "backNumber": 15,
          "position": "MF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 8124,
          "name": "Will Hughes",
          "backNumber": 19,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 191396,
          "name": "Adam Wharton",
          "backNumber": 20,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 97536,
          "name": "Quinten Timber",
          "backNumber": 23,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 74677,
          "name": "Cheick Doucouré",
          "backNumber": 28,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        }
      ],
      "DF": [
        {
          "id": 137068,
          "name": "Tyrick Mitchell",
          "backNumber": 3,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 99856,
          "name": "Chris Richards",
          "backNumber": 3,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 813,
          "name": "Axel Disasi",
          "backNumber": 5,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 260271,
          "name": "Jaydee Canvot",
          "backNumber": 6,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 150948,
          "name": "Chadi Riad",
          "backNumber": 18,
          "position": "DF",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 263661,
          "name": "Honest Ahanor",
          "backNumber": 21,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 9034,
          "name": "Takehiro Tomiyasu",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 213425,
          "name": "Anan Khalaili",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Israel",
          "koreanNation": "이스라엘",
          "flag": "🇮🇱"
        },
        {
          "id": 146986,
          "name": "Óscar Mingueza",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 8065,
          "name": "Ben Chilwell",
          "backNumber": 33,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5457,
          "name": "Dean Henderson",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6413,
          "name": "Remi Matthews",
          "backNumber": 31,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8420,
          "name": "Walter Benítez",
          "backNumber": 44,
          "position": "GK",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        }
      ]
    }
  },
  "397": {
    "teamId": 397,
    "apiTeamId": 397,
    "teamName": "Brighton & Hove Albion FC",
    "manager": {
      "name": "Fabian Hurzeler",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 132707,
          "name": "Kaoru Mitoma",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 209504,
          "name": "Stefanos Tzimas",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 81189,
          "name": "Georginio Rutter",
          "backNumber": 10,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 187482,
          "name": "Yankubah Minteh",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Gambia",
          "koreanNation": "감비아",
          "flag": "🇬🇲"
        },
        {
          "id": 260992,
          "name": "Promise Akinpelu",
          "backNumber": 12,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 205531,
          "name": "Ibrahim Osman",
          "backNumber": 15,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 264300,
          "name": "Charalampos Kostoulas",
          "backNumber": 19,
          "position": "FW",
          "nationality": "Greece",
          "koreanNation": "그리스",
          "flag": "🇬🇷"
        },
        {
          "id": 130809,
          "name": "Evan Ferguson",
          "backNumber": 28,
          "position": "FW",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 279784,
          "name": "Zadok Yohanna",
          "backNumber": 36,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        }
      ],
      "MF": [
        {
          "id": 190851,
          "name": "Jack Hinshelwood",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 8273,
          "name": "Pascal Groß",
          "backNumber": 13,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 270273,
          "name": "Chema Andrés",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 178951,
          "name": "Diego Gómez",
          "backNumber": 25,
          "position": "MF",
          "nationality": "Paraguay",
          "koreanNation": "파라과이",
          "flag": "🇵🇾"
        },
        {
          "id": 145613,
          "name": "Yasin Ayari",
          "backNumber": 26,
          "position": "MF",
          "nationality": "Sweden",
          "koreanNation": "스웨덴",
          "flag": "🇸🇪"
        },
        {
          "id": 3974,
          "name": "Matt O'Riley",
          "backNumber": 33,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 246670,
          "name": "Malick Yalcouyé",
          "backNumber": 35,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        },
        {
          "id": 29319,
          "name": "Femi Azeez",
          "backNumber": 39,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 4146,
          "name": "Pascal Struijk",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 8259,
          "name": "Lewis Dunk",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 147891,
          "name": "Jaouen Hadjam",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Algeria",
          "koreanNation": "알제리",
          "flag": "🇩🇿"
        },
        {
          "id": 97505,
          "name": "Mats Wieffer",
          "backNumber": 12,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 9869,
          "name": "Ferdi Kadıoğlu",
          "backNumber": 20,
          "position": "DF",
          "nationality": "Turkey",
          "koreanNation": "튀르키예",
          "flag": "🇹🇷"
        },
        {
          "id": 185116,
          "name": "Costinha",
          "backNumber": 20,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 846,
          "name": "Olivier Boscagli",
          "backNumber": 21,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 216835,
          "name": "Luka Vušković",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Croatia",
          "koreanNation": "크로아티아",
          "flag": "🇭🇷"
        },
        {
          "id": 61968,
          "name": "Michael Svoboda",
          "backNumber": 30,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 142075,
          "name": "Maxim De Cuyper",
          "backNumber": 55,
          "position": "DF",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "GK": [
        {
          "id": 126870,
          "name": "Bart Verbruggen",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 4040,
          "name": "Jason Steele",
          "backNumber": 23,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 140203,
          "name": "Thomas McGill",
          "backNumber": 38,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "402": {
    "teamId": 402,
    "apiTeamId": 402,
    "teamName": "Brentford FC",
    "manager": {
      "name": "Keith Andrews",
      "role": "감독 (Head Coach)",
      "nationality": "Ireland",
      "koreanNation": "아일랜드",
      "flag": "🇮🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 138230,
          "name": "Thiago",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 177305,
          "name": "Dango Ouattara",
          "backNumber": 11,
          "position": "FW",
          "nationality": "Burkina Faso",
          "koreanNation": "부르키나파소",
          "flag": "🇧🇫"
        },
        {
          "id": 8251,
          "name": "Callum Wilson",
          "backNumber": 13,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 123286,
          "name": "Kevin Schade",
          "backNumber": 16,
          "position": "FW",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        },
        {
          "id": 150778,
          "name": "Jaidon Anthony",
          "backNumber": 19,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 213296,
          "name": "Gustavo Gomes",
          "backNumber": 39,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 213518,
          "name": "Kaye Furo",
          "backNumber": 47,
          "position": "FW",
          "nationality": "Belgium",
          "koreanNation": "벨기에",
          "flag": "🇧🇪"
        }
      ],
      "MF": [
        {
          "id": 204421,
          "name": "Yegor Yarmolyuk",
          "backNumber": 6,
          "position": "MF",
          "nationality": "Ukraine",
          "koreanNation": "우크라이나",
          "flag": "🇺🇦"
        },
        {
          "id": 10194,
          "name": "Mathias Jensen",
          "backNumber": 8,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 7796,
          "name": "Josh Dasilva",
          "backNumber": 10,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 151119,
          "name": "Fabio Carvalho",
          "backNumber": 14,
          "position": "MF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 171965,
          "name": "Antoni Milambo",
          "backNumber": 17,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 150964,
          "name": "Mamadou Sangare",
          "backNumber": 18,
          "position": "MF",
          "nationality": "Mali",
          "koreanNation": "말리",
          "flag": "🇲🇱"
        },
        {
          "id": 101910,
          "name": "Keane Lewis-Potter",
          "backNumber": 23,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24238,
          "name": "Mikkel Damsgaard",
          "backNumber": 24,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 10000,
          "name": "Vitaly Janelt",
          "backNumber": 27,
          "position": "MF",
          "nationality": "Germany",
          "koreanNation": "독일",
          "flag": "🇩🇪"
        }
      ],
      "DF": [
        {
          "id": 101111,
          "name": "Aaron Hickey",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 4426,
          "name": "Rico Henry",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 16068,
          "name": "Kristoffer Ajer",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Norway",
          "koreanNation": "노르웨이",
          "flag": "🇳🇴"
        },
        {
          "id": 7720,
          "name": "Sepp van den Berg",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 115642,
          "name": "Nathan Collins",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 193633,
          "name": "El Hadji Malick Diouf",
          "backNumber": 25,
          "position": "DF",
          "nationality": "Senegal",
          "koreanNation": "세네갈",
          "flag": "🇸🇳"
        },
        {
          "id": 204348,
          "name": "Michael Kayode",
          "backNumber": 33,
          "position": "DF",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        },
        {
          "id": 221783,
          "name": "Ji-soo Kim",
          "backNumber": 36,
          "position": "DF",
          "nationality": "South Korea",
          "koreanNation": "대한민국",
          "flag": "🇰🇷"
        },
        {
          "id": 227064,
          "name": "Jannik Schuster",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Austria",
          "koreanNation": "오스트리아",
          "flag": "🇦🇹"
        },
        {
          "id": 245364,
          "name": "Benjamin Fredrick",
          "backNumber": 48,
          "position": "DF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        }
      ],
      "GK": [
        {
          "id": 102046,
          "name": "Caoimhin Kelleher",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Ireland",
          "koreanNation": "아일랜드",
          "flag": "🇮🇪"
        },
        {
          "id": 144530,
          "name": "Hákon Rafn Valdimarsson",
          "backNumber": 12,
          "position": "GK",
          "nationality": "Iceland",
          "koreanNation": "아이슬란드",
          "flag": "🇮🇸"
        },
        {
          "id": 4419,
          "name": "Ellery Balcombe",
          "backNumber": 31,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  },
  "1044": {
    "teamId": 1044,
    "apiTeamId": 1044,
    "teamName": "AFC Bournemouth",
    "manager": {
      "name": "Marco Rose",
      "role": "감독 (Head Coach)",
      "nationality": "Germany",
      "koreanNation": "독일",
      "flag": "🇩🇪"
    },
    "squad": {
      "FW": [
        {
          "id": 4321,
          "name": "David Brooks",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 131260,
          "name": "Evanilson",
          "backNumber": 9,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 176789,
          "name": "Ben Doak",
          "backNumber": 17,
          "position": "FW",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 137047,
          "name": "Amine Adli",
          "backNumber": 21,
          "position": "FW",
          "nationality": "Morocco",
          "koreanNation": "모로코",
          "flag": "🇲🇦"
        },
        {
          "id": 204241,
          "name": "Eli Kroupi",
          "backNumber": 22,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 203356,
          "name": "Rayan",
          "backNumber": 26,
          "position": "FW",
          "nationality": "Brazil",
          "koreanNation": "브라질",
          "flag": "🇧🇷"
        },
        {
          "id": 169191,
          "name": "Daniel Jebbison",
          "backNumber": 29,
          "position": "FW",
          "nationality": "Canada",
          "koreanNation": "캐나다",
          "flag": "🇨🇦"
        },
        {
          "id": 189369,
          "name": "Alvaro Rodriguez",
          "backNumber": 30,
          "position": "FW",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        }
      ],
      "MF": [
        {
          "id": 3327,
          "name": "Lewis Cook",
          "backNumber": 4,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 7561,
          "name": "Justin Kluivert",
          "backNumber": 7,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 161088,
          "name": "Alex Scott",
          "backNumber": 8,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 34495,
          "name": "Ryan Christie",
          "backNumber": 11,
          "position": "MF",
          "nationality": "Scotland",
          "koreanNation": "스코틀랜드",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
        },
        {
          "id": 77596,
          "name": "Tyler Adams",
          "backNumber": 12,
          "position": "MF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 6396,
          "name": "Marcus Tavernier",
          "backNumber": 16,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 192316,
          "name": "Alex Toth",
          "backNumber": 21,
          "position": "MF",
          "nationality": "Hungary",
          "koreanNation": "헝가리",
          "flag": "🇭🇺"
        },
        {
          "id": 273152,
          "name": "Ben Winterburn",
          "backNumber": 47,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "DF": [
        {
          "id": 113335,
          "name": "Julian Araujo",
          "backNumber": 2,
          "position": "DF",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 135482,
          "name": "Adrien Truffert",
          "backNumber": 3,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 185610,
          "name": "Antonio Silva",
          "backNumber": 4,
          "position": "DF",
          "nationality": "Portugal",
          "koreanNation": "포르투갈",
          "flag": "🇵🇹"
        },
        {
          "id": 82145,
          "name": "James Hill",
          "backNumber": 5,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 183583,
          "name": "Julio Soler",
          "backNumber": 6,
          "position": "DF",
          "nationality": "Argentina",
          "koreanNation": "아르헨티나",
          "flag": "🇦🇷"
        },
        {
          "id": 8231,
          "name": "Adam Smith",
          "backNumber": 15,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 98745,
          "name": "Bafodé Diakité",
          "backNumber": 18,
          "position": "DF",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 180038,
          "name": "Juanlu",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Spain",
          "koreanNation": "스페인",
          "flag": "🇪🇸"
        },
        {
          "id": 80765,
          "name": "Max Aarons",
          "backNumber": 28,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 227046,
          "name": "Veljko Milosavljević",
          "backNumber": 44,
          "position": "DF",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        }
      ],
      "GK": [
        {
          "id": 121765,
          "name": "Đorđe Petrović",
          "backNumber": 1,
          "position": "GK",
          "nationality": "Serbia",
          "koreanNation": "세르비아",
          "flag": "🇷🇸"
        },
        {
          "id": 8079,
          "name": "Fraser Forster",
          "backNumber": 17,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 41381,
          "name": "Michele Di Gregorio",
          "backNumber": 20,
          "position": "GK",
          "nationality": "Italy",
          "koreanNation": "이탈리아",
          "flag": "🇮🇹"
        }
      ]
    }
  },
  "1076": {
    "teamId": 1076,
    "apiTeamId": 1076,
    "teamName": "Coventry City FC",
    "manager": {
      "name": "Frank Lampard",
      "role": "감독 (Head Coach)",
      "nationality": "England",
      "koreanNation": "잉글랜드",
      "flag": "EN"
    },
    "squad": {
      "FW": [
        {
          "id": 113632,
          "name": "Tatsuhiro Sakamoto",
          "backNumber": 7,
          "position": "FW",
          "nationality": "Japan",
          "koreanNation": "일본",
          "flag": "🇯🇵"
        },
        {
          "id": 146122,
          "name": "Ellis Simms",
          "backNumber": 9,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6389,
          "name": "Brandon Thomas-Asante",
          "backNumber": 10,
          "position": "FW",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 6009,
          "name": "Ephron Mason-Clark",
          "backNumber": 10,
          "position": "FW",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 9218,
          "name": "Taiwo Awoniyi",
          "backNumber": 14,
          "position": "FW",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 170394,
          "name": "Loum Tchaouna",
          "backNumber": 18,
          "position": "FW",
          "nationality": "France",
          "koreanNation": "프랑스",
          "flag": "🇫🇷"
        },
        {
          "id": 10076,
          "name": "Haji Wright",
          "backNumber": 19,
          "position": "FW",
          "nationality": "USA",
          "koreanNation": "미국",
          "flag": "🇺🇸"
        },
        {
          "id": 213712,
          "name": "Sidiki Cherif",
          "backNumber": 26,
          "position": "FW",
          "nationality": "Guinea",
          "koreanNation": "기니",
          "flag": "🇬🇳"
        }
      ],
      "MF": [
        {
          "id": 262187,
          "name": "Caleb Yirenkyi",
          "backNumber": 3,
          "position": "MF",
          "nationality": "Ghana",
          "koreanNation": "가나",
          "flag": "🇬🇭"
        },
        {
          "id": 114123,
          "name": "Jack Rudoni",
          "backNumber": 5,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 6358,
          "name": "Matt Grimes",
          "backNumber": 6,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24210,
          "name": "Frank Onyeka",
          "backNumber": 16,
          "position": "MF",
          "nationality": "Nigeria",
          "koreanNation": "나이지리아",
          "flag": "🇳🇬"
        },
        {
          "id": 83372,
          "name": "Josh Eccles",
          "backNumber": 28,
          "position": "MF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 24207,
          "name": "Victor Torp",
          "backNumber": 29,
          "position": "MF",
          "nationality": "Denmark",
          "koreanNation": "덴마크",
          "flag": "🇩🇰"
        },
        {
          "id": 9623,
          "name": "Gustavo Hamer",
          "backNumber": 38,
          "position": "MF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        }
      ],
      "DF": [
        {
          "id": 4334,
          "name": "Ethan Pinnock",
          "backNumber": 2,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 6308,
          "name": "Jay Dasilva",
          "backNumber": 3,
          "position": "DF",
          "nationality": "Wales",
          "koreanNation": "웨일스",
          "flag": "CY"
        },
        {
          "id": 144782,
          "name": "Bobby Thomas",
          "backNumber": 4,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171509,
          "name": "Kaine Kesler",
          "backNumber": 20,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4015,
          "name": "Jake Bidwell",
          "backNumber": 21,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 130044,
          "name": "Joel Latibeaudiere",
          "backNumber": 22,
          "position": "DF",
          "nationality": "Jamaica",
          "koreanNation": "자메이카",
          "flag": "🇯🇲"
        },
        {
          "id": 169297,
          "name": "Aurele Amenda",
          "backNumber": 24,
          "position": "DF",
          "nationality": "Switzerland",
          "koreanNation": "스위스",
          "flag": "🇨🇭"
        },
        {
          "id": 4235,
          "name": "Luke Woolfenden",
          "backNumber": 26,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 55048,
          "name": "Milan van Ewijk",
          "backNumber": 27,
          "position": "DF",
          "nationality": "Netherlands",
          "koreanNation": "네덜란드",
          "flag": "🇳🇱"
        },
        {
          "id": 286320,
          "name": "Stephen Mfuni",
          "backNumber": 30,
          "position": "DF",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ],
      "GK": [
        {
          "id": 5347,
          "name": "Ben Wilson",
          "backNumber": 13,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 171498,
          "name": "Carl Rushworth",
          "backNumber": 19,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        },
        {
          "id": 4418,
          "name": "Daniel Bentley",
          "backNumber": 25,
          "position": "GK",
          "nationality": "England",
          "koreanNation": "잉글랜드",
          "flag": "EN"
        }
      ]
    }
  }
};

export default teamSquadData;

import type { SelectGroup } from "@/components/ui/CustomSelect";

type CityNeighborhoodDirectory = Record<string, SelectGroup[]>;

const SENEGAL_CITY_NEIGHBORHOODS: CityNeighborhoodDirectory = {
  Dakar: [
    {
      group: "Centre",
      options: [
        { value: "Plateau", label: "Plateau" },
        { value: "Medina", label: "Medina" },
        { value: "Bel Air", label: "Bel Air" },
        { value: "Colobane", label: "Colobane" },
        { value: "Fass", label: "Fass" },
      ],
    },
    {
      group: "Fann / Mermoz / Liberte",
      options: [
        { value: "Point E", label: "Point E" },
        { value: "Fann-Residence", label: "Fann-Residence" },
        { value: "Mermoz", label: "Mermoz" },
        { value: "Sacre-Coeur", label: "Sacre-Coeur" },
        { value: "Liberte", label: "Liberte" },
      ],
    },
    {
      group: "Ouest",
      options: [
        { value: "Almadies", label: "Almadies" },
        { value: "Ngor", label: "Ngor" },
        { value: "Yoff", label: "Yoff" },
        { value: "Ouakam", label: "Ouakam" },
        { value: "Les Mamelles", label: "Les Mamelles" },
      ],
    },
  ],
  Guediawaye: [
    {
      group: "Communes",
      options: [
        { value: "Golf Sud", label: "Golf Sud" },
        { value: "Sam Notaire", label: "Sam Notaire" },
        { value: "Ndiarème Limamoulaye", label: "Ndiarème Limamoulaye" },
        { value: "Wakhinane Nimzatt", label: "Wakhinane Nimzatt" },
        { value: "Medina Gounass", label: "Medina Gounass" },
      ],
    },
  ],
  Pikine: [
    {
      group: "Pikine",
      options: [
        { value: "Pikine Icotaf", label: "Pikine Icotaf" },
        { value: "Guinaw Rails", label: "Guinaw Rails" },
        { value: "Thiaroye", label: "Thiaroye" },
        { value: "Yeumbeul", label: "Yeumbeul" },
        { value: "Mbao", label: "Mbao" },
      ],
    },
  ],
  "Keur Massar": [
    {
      group: "Keur Massar",
      options: [
        { value: "Keur Massar Nord", label: "Keur Massar Nord" },
        { value: "Keur Massar Sud", label: "Keur Massar Sud" },
        { value: "Jaxaay", label: "Jaxaay" },
        { value: "Malika", label: "Malika" },
        { value: "Sangalkam", label: "Sangalkam" },
      ],
    },
  ],
  Rufisque: [
    {
      group: "Rufisque",
      options: [
        { value: "Rufisque Est", label: "Rufisque Est" },
        { value: "Rufisque Nord", label: "Rufisque Nord" },
        { value: "Rufisque Ouest", label: "Rufisque Ouest" },
        { value: "Bargny", label: "Bargny" },
        { value: "Diamniadio", label: "Diamniadio" },
      ],
    },
  ],
  Thies: [
    {
      group: "Thies",
      options: [
        { value: "Randoulene", label: "Randoulene" },
        { value: "HLM Thies", label: "HLM Thies" },
        { value: "Hersent", label: "Hersent" },
        { value: "Thionakh", label: "Thionakh" },
        { value: "Som", label: "Som" },
      ],
    },
  ],
  Tivaouane: [
    {
      group: "Tivaouane",
      options: [
        { value: "Escale", label: "Escale" },
        { value: "Keur Maba", label: "Keur Maba" },
        { value: "Pire", label: "Pire" },
        { value: "Mboro", label: "Mboro" },
        { value: "Meouane", label: "Meouane" },
      ],
    },
  ],
  Mbour: [
    {
      group: "Mbour",
      options: [
        { value: "Mbour Serere", label: "Mbour Serere" },
        { value: "Tefess", label: "Tefess" },
        { value: "Grand Mbour", label: "Grand Mbour" },
        { value: "Saly Portudal", label: "Saly Portudal" },
        { value: "Nguering", label: "Nguering" },
      ],
    },
  ],
  "Saly Portudal": [
    {
      group: "Saly",
      options: [
        { value: "Saly Niakh Niakhal", label: "Saly Niakh Niakhal" },
        { value: "Saly Carrefour", label: "Saly Carrefour" },
        { value: "Ngaparou", label: "Ngaparou" },
        { value: "Somone", label: "Somone" },
        { value: "Warang", label: "Warang" },
      ],
    },
  ],
  "Joal-Fadiouth": [
    {
      group: "Joal-Fadiouth",
      options: [
        { value: "Escale", label: "Escale" },
        { value: "Ndiorokh", label: "Ndiorokh" },
        { value: "Ngalou", label: "Ngalou" },
        { value: "Fadiouth", label: "Fadiouth" },
        { value: "Mbour 4", label: "Mbour 4" },
      ],
    },
  ],
  "Saint-Louis": [
    {
      group: "Saint-Louis",
      options: [
        { value: "Sor", label: "Sor" },
        { value: "Ndar Toute", label: "Ndar Toute" },
        { value: "Guet Ndar", label: "Guet Ndar" },
        { value: "Pikine Saint-Louis", label: "Pikine Saint-Louis" },
        { value: "Hydrobase", label: "Hydrobase" },
      ],
    },
  ],
  "Richard-Toll": [
    {
      group: "Richard-Toll",
      options: [
        { value: "Escal", label: "Escal" },
        { value: "Ndiangué", label: "Ndiangué" },
        { value: "Khouma", label: "Khouma" },
        { value: "Gaé", label: "Gaé" },
        { value: "Ndombo", label: "Ndombo" },
      ],
    },
  ],
  Dagana: [
    {
      group: "Dagana",
      options: [
        { value: "Dagana Centre", label: "Dagana Centre" },
        { value: "Ndiawara", label: "Ndiawara" },
        { value: "Ross Bethio", label: "Ross Bethio" },
        { value: "Gnith", label: "Gnith" },
        { value: "Mbane", label: "Mbane" },
      ],
    },
  ],
  Ziguinchor: [
    {
      group: "Ziguinchor",
      options: [
        { value: "Boucotte", label: "Boucotte" },
        { value: "Nema", label: "Nema" },
        { value: "Kandialang", label: "Kandialang" },
        { value: "Lyndiane", label: "Lyndiane" },
        { value: "Santhiaba", label: "Santhiaba" },
      ],
    },
  ],
  Bignona: [
    {
      group: "Bignona",
      options: [
        { value: "Bignona Centre", label: "Bignona Centre" },
        { value: "Kafountine", label: "Kafountine" },
        { value: "Tendouck", label: "Tendouck" },
        { value: "Diouloulou", label: "Diouloulou" },
        { value: "Thionck Essyl", label: "Thionck Essyl" },
      ],
    },
  ],
  Oussouye: [
    {
      group: "Oussouye",
      options: [
        { value: "Oussouye Centre", label: "Oussouye Centre" },
        { value: "Mlomp", label: "Mlomp" },
        { value: "Cabrousse", label: "Cabrousse" },
        { value: "Diembering", label: "Diembering" },
        { value: "Cap Skirring", label: "Cap Skirring" },
      ],
    },
  ],
  Kaolack: [
    {
      group: "Kaolack",
      options: [
        { value: "Leona", label: "Leona" },
        { value: "Medina Baye", label: "Medina Baye" },
        { value: "Kasnack", label: "Kasnack" },
        { value: "Ndorong", label: "Ndorong" },
        { value: "Sam", label: "Sam" },
      ],
    },
  ],
  "Nioro du Rip": [
    {
      group: "Nioro du Rip",
      options: [
        { value: "Nioro Centre", label: "Nioro Centre" },
        { value: "Keur Madiabel", label: "Keur Madiabel" },
        { value: "Wack Ngouna", label: "Wack Ngouna" },
        { value: "Porokhane", label: "Porokhane" },
        { value: "Keur Ayib", label: "Keur Ayib" },
      ],
    },
  ],
  Diourbel: [
    {
      group: "Diourbel",
      options: [
        { value: "Escale", label: "Escale" },
        { value: "Keur Goumack", label: "Keur Goumack" },
        { value: "Darou Marnane", label: "Darou Marnane" },
        { value: "Ndoulo", label: "Ndoulo" },
        { value: "Thierno Kandji", label: "Thierno Kandji" },
      ],
    },
  ],
  Touba: [
    {
      group: "Touba",
      options: [
        { value: "Touba Mosquee", label: "Touba Mosquee" },
        { value: "Darou Khoudoss", label: "Darou Khoudoss" },
        { value: "Ndamatou", label: "Ndamatou" },
        { value: "Keur Niang", label: "Keur Niang" },
        { value: "Mbal", label: "Mbal" },
      ],
    },
  ],
  Mbacke: [
    {
      group: "Mbacke",
      options: [
        { value: "Mbacke Centre", label: "Mbacke Centre" },
        { value: "Darou Salam", label: "Darou Salam" },
        { value: "Taif", label: "Taif" },
        { value: "Nghaye", label: "Nghaye" },
        { value: "Missirah", label: "Missirah" },
      ],
    },
  ],
  Louga: [
    {
      group: "Louga",
      options: [
        { value: "Artillerie", label: "Artillerie" },
        { value: "Santhiaba Sud", label: "Santhiaba Sud" },
        { value: "Montagne", label: "Montagne" },
        { value: "Ndiang Khaw", label: "Ndiang Khaw" },
        { value: "Keur Serigne Louga", label: "Keur Serigne Louga" },
      ],
    },
  ],
  Fatick: [
    {
      group: "Fatick",
      options: [
        { value: "Fatick Centre", label: "Fatick Centre" },
        { value: "Ndiaye Ndiaye", label: "Ndiaye Ndiaye" },
        { value: "Darou Rahmane", label: "Darou Rahmane" },
        { value: "Thioffack", label: "Thioffack" },
        { value: "Peulga", label: "Peulga" },
      ],
    },
  ],
  Kaffrine: [
    {
      group: "Kaffrine",
      options: [
        { value: "Kaffrine Centre", label: "Kaffrine Centre" },
        { value: "Diamaguene", label: "Diamaguene" },
        { value: "Medina", label: "Medina" },
        { value: "Koungheul", label: "Koungheul" },
        { value: "Birkelane", label: "Birkelane" },
      ],
    },
  ],
  Tambacounda: [
    {
      group: "Tambacounda",
      options: [
        { value: "Depot", label: "Depot" },
        { value: "Quinzambougou", label: "Quinzambougou" },
        { value: "Medinacoura", label: "Medinacoura" },
        { value: "Abattoirs", label: "Abattoirs" },
        { value: "Gourel Diadie", label: "Gourel Diadie" },
      ],
    },
  ],
  Kolda: [
    {
      group: "Kolda",
      options: [
        { value: "Sikilo", label: "Sikilo" },
        { value: "Doumassou", label: "Doumassou" },
        { value: "Bantang", label: "Bantang" },
        { value: "Saré Kemo", label: "Saré Kemo" },
        { value: "Hilele", label: "Hilele" },
      ],
    },
  ],
  Matam: [
    {
      group: "Matam",
      options: [
        { value: "Matam Escale", label: "Matam Escale" },
        { value: "Ouro Sogui", label: "Ouro Sogui" },
        { value: "Thilogne", label: "Thilogne" },
        { value: "Kanel", label: "Kanel" },
        { value: "Ranerou", label: "Ranerou" },
      ],
    },
  ],
  Kedougou: [
    {
      group: "Kedougou",
      options: [
        { value: "Kedougou Centre", label: "Kedougou Centre" },
        { value: "Bandafassi", label: "Bandafassi" },
        { value: "Saraya", label: "Saraya" },
        { value: "Salemata", label: "Salemata" },
        { value: "Dimboli", label: "Dimboli" },
      ],
    },
  ],
  Sedhiou: [
    {
      group: "Sedhiou",
      options: [
        { value: "Nema", label: "Nema" },
        { value: "Santassou", label: "Santassou" },
        { value: "Bounkiling", label: "Bounkiling" },
        { value: "Goudomp", label: "Goudomp" },
        { value: "Kandiadiou", label: "Kandiadiou" },
      ],
    },
  ],
};

export const SENEGAL_CITY_OPTIONS = Object.keys(SENEGAL_CITY_NEIGHBORHOODS)
  .sort((a, b) => a.localeCompare(b, "fr"))
  .map((city) => ({ value: city, label: city }));

export function getSenegalNeighborhoodGroups(city: string): SelectGroup[] {
  const normalizedCity = city.trim();
  if (!normalizedCity) return [];
  return SENEGAL_CITY_NEIGHBORHOODS[normalizedCity] ?? [];
}

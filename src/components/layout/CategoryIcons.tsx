"use client";

import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    label: "Maisons",
    type: "maison",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
  },
  {
    label: "Villas",
    type: "villa",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80",
  },
  {
    label: "Appartements",
    type: "appartement",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
  },
  {
    label: "Bureaux",
    type: "bureau",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
  },
  {
    label: "Terrains",
    type: "terrain",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80",
  },
  {
    label: "Locaux comm.",
    type: "local_commercial",
    img: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&q=80",
  },
  {
    label: "Duplexes",
    type: "duplex",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
  },
];

export default function CategoryIcons() {
  return (
    <>
      <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2.5 pb-1 min-w-max">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.type}
              href={`/biens?type=${cat.type}`}
              className="relative w-[82px] h-[100px] rounded-xl overflow-hidden shrink-0 group active:scale-[.97] transition-transform"
            >
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="82px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-bold text-white leading-tight drop-shadow-md">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.type}
            href={`/biens?type=${cat.type}`}
            className="relative h-28 rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-transform"
          >
            <Image
              src={cat.img}
              alt={cat.label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 1024px) 33vw, 14vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white leading-tight drop-shadow-md">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

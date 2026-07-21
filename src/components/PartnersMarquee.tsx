import amazonLogo from "@/assets/brand-amazon.webp";
import mercadoLivreLogo from "@/assets/brand-mercadolivre.webp";
import shopeeLogo from "@/assets/brand-shopee.webp";
import magaluLogo from "@/assets/brand-magalu.webp";

const partners = [
  { name: "Amazon", src: amazonLogo },
  { name: "Mercado Livre", src: mercadoLivreLogo },
  { name: "Shopee", src: shopeeLogo },
  { name: "Magalu", src: magaluLogo },
];

const PartnersMarquee = () => {
  // Duplicate the list so the -50% translate creates a seamless loop
  const items = [...partners, ...partners];

  return (
    <div className="relative h-[140px] sm:h-[156px] overflow-hidden rounded-2xl bg-card/40 py-0 backdrop-blur flex items-center">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-20" />

      <div className="flex w-max animate-marquee items-center gap-16 pr-16 sm:gap-24 sm:pr-24">
        {items.map((p, i) => (
          <img
            key={`${p.name}-${i}`}
            src={p.src}
            alt={p.name}
            loading="lazy"
            decoding="async"
            width="200"
            height="60"
            className={`w-auto shrink-0 object-contain ${
              p.name === "Amazon"
                ? "h-32 sm:h-36 -mx-[3.2rem] sm:-mx-[4.8rem]"
                : p.name === "Magalu"
                ? "h-8 sm:h-9"
                : "h-10 sm:h-12"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PartnersMarquee;

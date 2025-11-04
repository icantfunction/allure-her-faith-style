const PromoBanner = () => {
  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="text-sm font-medium inline-flex items-center">
            Up to 15% OFF&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;USE CODE: DINA <span className="mx-8 text-xs">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default PromoBanner;

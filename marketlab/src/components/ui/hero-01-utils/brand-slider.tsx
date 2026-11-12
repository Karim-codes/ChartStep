export interface BrandList {
  image?: string;
  lightimg?: string;
  name: string;
  description?: string;
  symbol?: string;
}

/** Same composition point as the supplied logo strip, used for supported markets rather than unverified customer logos. */
export default function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  return (
    <div className="lp-market-strip" aria-label="Supported practice markets">
      <div className="lp-market-intro">
        ONE LAB.
        <br />
        <span>A FEW DIFFERENT MARKETS.</span>
      </div>
      <div className="lp-markets">
        {brandList.map((item) => (
          <div className="lp-market" key={item.name}>
            <span className="lp-market-symbol">{item.symbol}</span>
            <div>
              <strong>{item.name}</strong>
              <small>{item.description}</small>
            </div>
          </div>
        ))}
      </div>
      <span className="lp-strip-note">
        ALL SYNTHETIC.
        <br />
        ALL YOURS TO EXPLORE.
      </span>
    </div>
  );
}

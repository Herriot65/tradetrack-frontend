// A decorative CSS sculpture: no canvas, network assets or financial data.
export default function DepthScene() {
  return (
    <div className="nx-depth-scene" aria-hidden="true">
      <div className="nx-depth-halo" /><div className="nx-depth-orbit" /><div className="nx-depth-orbit nx-depth-orbit-outer" />
      <div className="nx-depth-stage">
        <div className="nx-depth-platform" />
        {[0, 1, 2, 3].map(index => (
          <div key={index} className="nx-depth-bar" style={{ '--bar': index }}>
            <span className="nx-depth-front" />
            <span className="nx-depth-side" />
            <span className="nx-depth-top" />
          </div>
        ))}
      </div>
    </div>
  );
}

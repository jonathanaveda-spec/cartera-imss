import { Composition } from "remotion";
import { TikTok01Libreta } from "./TikTok01Libreta";
import { TikTok02Excel, TOTAL_02 } from "./TikTok02Excel";
import { TikTok03Pin, TOTAL_03 } from "./TikTok03Pin";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TikTok01Libreta"
        component={TikTok01Libreta}
        durationInFrames={630}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
      <Composition
        id="TikTok02Excel"
        component={TikTok02Excel}
        durationInFrames={TOTAL_02}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
      <Composition
        id="TikTok03Pin"
        component={TikTok03Pin}
        durationInFrames={TOTAL_03}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
    </>
  );
};

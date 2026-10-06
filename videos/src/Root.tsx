import { Composition } from "remotion";
import { TikTok01Libreta } from "./TikTok01Libreta";

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
    </>
  );
};

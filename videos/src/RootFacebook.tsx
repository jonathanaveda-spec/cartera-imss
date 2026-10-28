import { Composition } from "remotion";
import { FB1, FB2, FB3, FB4, FB_H, FB_W, FBPortada, PORTADA_H, PORTADA_W } from "./facebook/Facebook";

// Imagenes fijas de Facebook 1080x1350 (4:5): npx remotion still FB1 out/facebook/FB1_....png
export const ComposicionesFacebook: React.FC = () => (
  <>
    <Composition id="FB1" component={FB1} durationInFrames={1} fps={30} width={FB_W} height={FB_H} />
    <Composition id="FB2" component={FB2} durationInFrames={1} fps={30} width={FB_W} height={FB_H} />
    <Composition id="FB3" component={FB3} durationInFrames={1} fps={30} width={FB_W} height={FB_H} />
    <Composition id="FB4" component={FB4} durationInFrames={1} fps={30} width={FB_W} height={FB_H} />
    <Composition id="FBPortada" component={FBPortada} durationInFrames={1} fps={30} width={PORTADA_W} height={PORTADA_H} />
  </>
);

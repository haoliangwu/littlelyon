import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export default function ImagePreviewer({ src, ...props }: { src: string }) {
  return (
    <PhotoProvider>
      <PhotoView src={src}>
        <img src={src} {...props} />
      </PhotoView>
    </PhotoProvider>
  );
}

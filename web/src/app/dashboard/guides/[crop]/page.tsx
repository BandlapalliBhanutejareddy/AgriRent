import CropGuideDetail from './client';

export function generateStaticParams() {
  return [
    { crop: 'rice' },
    { crop: 'wheat' },
    { crop: 'maize' },
    { crop: 'cotton' },
    { crop: 'sugarcane' },
    { crop: 'tomato' },
    { crop: 'potato' },
    { crop: 'onion' }
  ];
}

export default function Page() {
  return <CropGuideDetail />;
}

function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;
  return Response.json({
    "accountAssociation": {
      "header": "eyJmaWQiOjEwMjczNzgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhkMDg1MDE2QTY2Q2VlMGM5OUZjNjYwY0NDRGQ2NmNiNURkNTQxMDM0In0",
      "payload": "eyJkb21haW4iOiJmYXVjZXQtY2xhaW0udmVyY2VsLmFwcCJ9",
      "signature": "yJfsHvOPtdDEdyBPLG0dhOdAzmTYVCpd7m6PlPUWdslaaMnHz46akmN8mNV/v5k2sLWUiqu1c+7S8lU4QOzM0Rs="
    }, // <- Added missing comma here
    
    // return Response.json({
    //   accountAssociation: {
    //     header: process.env.FARCASTER_HEADER,
    //     payload: process.env.FARCASTER_PAYLOAD,
    //     signature: process.env.FARCASTER_SIGNATURE,
    //   },
    
    frame: {
      name: "faucet earn",
      version: "1",
      iconUrl: "https://faucet-claim.vercel.app/icon.png",
      homeUrl: "https://faucet-claim.vercel.app",
      imageUrl: "https://faucet-claim.vercel.app/image.png",
      buttonTitle: "claim",
      splashImageUrl: "https://faucet-claim.vercel.app/splash.png",
      splashBackgroundColor: "#ffffff",
      webhookUrl: "https://faucet-claim.vercel.app/api/webhook",
      primaryCategory: "utility",
      description: "facuet ",
      subtitle: "a facuet"
    },
  });
}
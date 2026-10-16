const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for MAA VAISHNO VIDEO FILM'S...");

  // 1. Create or update Default Admin User
  const adminPassword = process.env.ADMIN_DEFAULT_PASS || "MaaVaishno@2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {
      passwordHash,
      email: "admin@maavaishnovideofilms.com",
      name: "Abhimanyu Kumar",
      role: "SUPERADMIN",
    },
    create: {
      username: "admin",
      email: "admin@maavaishnovideofilms.com",
      passwordHash,
      name: "Abhimanyu Kumar",
      role: "SUPERADMIN",
      isActive: true,
    },
  });
  console.log("Admin user seeded:", admin.username);

  // 2. Default Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "MAA VAISHNO VIDEO FILM'S",
      proprietor: "Abhimanyu Kumar",
      phone: "9708345649",
      email: "contact@maavaishnovideofilms.com",
      address: "Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar - 844101",
      mapsUrl: "https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68",
      heroHeadline: "MAA VAISHNO VIDEO FILM'S",
      heroSubhead: "Capturing Moments. Creating Memories.",
      heroDescription: "Professional Photography, Cinematic Films, Customized Gifts, Premium Photo Frames and Digital Services—all in one place.",
      socialLinksJson: JSON.stringify({
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        youtube: "https://youtube.com",
      }),
      footerText: "Trusted by thousands of families in Hajipur & Vaishali.",
    },
  });
  console.log("Site settings seeded.");

  // 3. Categories
  const categoriesData = [
    { name: "Customized Mugs", slug: "customized-mugs", description: "Sublimation printed ceramic, magic, and color-patch mugs", sortOrder: 1 },
    { name: "Premium Photo Frames", slug: "premium-photo-frames", description: "High-grade wooden, waterproof, LED and customized frames", sortOrder: 2 },
    { name: "Sublimation Gifts", slug: "sublimation-gifts", description: "Custom t-shirts, keychains, cushions, and corporate gifts", sortOrder: 3 },
    { name: "Photography & Shoots", slug: "photography-shoots", description: "Candid, traditional, wedding, and event photography", sortOrder: 4 },
    { name: "Cinematic Videography", slug: "cinematic-videography", description: "4K cinematic wedding films, drone coverage, and teasers", sortOrder: 5 },
    { name: "Cyber Cafe & Digital Services", slug: "cyber-cafe", description: "PAN card, Voter ID, online applications, high-res printing", sortOrder: 6 },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log("Categories seeded.");

  // 4. Products - Mugs
  const mugProducts = [
    {
      name: "Magic Color Changing Mug",
      slug: "magic-color-changing-mug",
      description: "Heat-sensitive matte black mug that magically reveals your high-definition photo and custom message when hot liquid is poured.",
      details: "Capacity: 325ml | Material: High Grade Ceramic | Microwave Safe | Glossy reveal finish",
      pricePaise: 34900,
      mrpPaise: 49900,
      discountPercent: 30,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Matte Black to White", sku: "MUG-MAG-01", priceDeltaPaise: 0 },
        { name: "Glitter Red Magic", sku: "MUG-MAG-02", priceDeltaPaise: 5000 },
      ],
    },
    {
      name: "Classic Ceramic White Mug",
      slug: "classic-ceramic-white-mug",
      description: "Crisp white 11oz ceramic mug with ultra-vivid sublimation photo print. Scratch-resistant coating and dishwasher safe.",
      details: "Capacity: 330ml | Material: Premium Grade A Ceramic | Permanent Sublimation Print",
      pricePaise: 19900,
      mrpPaise: 29900,
      discountPercent: 33,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Standard 11oz", sku: "MUG-WHT-11", priceDeltaPaise: 0 },
        { name: "Jumbo 15oz", sku: "MUG-WHT-15", priceDeltaPaise: 6000 },
      ],
    },
    {
      name: "Inner Color Accent Mug",
      slug: "inner-color-accent-mug",
      description: "Stylish dual-tone mug featuring a bright vibrant interior color and a clean white exterior for your customized photos.",
      details: "Color Options: Crimson Red, Royal Blue, Bright Yellow, Forest Green | 325ml Capacity",
      pricePaise: 24900,
      mrpPaise: 34900,
      discountPercent: 28,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Crimson Red Inner", sku: "MUG-INR-RED", priceDeltaPaise: 0 },
        { name: "Royal Blue Inner", sku: "MUG-INR-BLU", priceDeltaPaise: 0 },
        { name: "Golden Yellow Inner", sku: "MUG-INR-YEL", priceDeltaPaise: 0 },
      ],
    },
    {
      name: "Handle Colored Designer Mug",
      slug: "handle-colored-designer-mug",
      description: "Distinctive mug with matching rim and handle colored accents for wedding and birthday favors.",
      details: "Material: Ceramic | Print: 360 Degree Panoramic Sublimation",
      pricePaise: 26900,
      mrpPaise: 36900,
      discountPercent: 27,
      isAvailable: true,
      isFeatured: false,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Cherry Red Handle", sku: "MUG-HDL-RED", priceDeltaPaise: 0 },
        { name: "Emerald Green Handle", sku: "MUG-HDL-GRN", priceDeltaPaise: 0 },
      ],
    },
    {
      name: "Color Patch Heart Mug",
      slug: "color-patch-heart-mug",
      description: "Special edition mug with a die-cut heart-shaped photo frame patch surrounded by premium textured coating.",
      details: "Ideal for anniversaries, Valentine's, and engagement gifts.",
      pricePaise: 29900,
      mrpPaise: 39900,
      discountPercent: 25,
      isAvailable: true,
      isFeatured: false,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Heart Patch Red", sku: "MUG-PTCH-HRT", priceDeltaPaise: 0 },
      ],
    },
    {
      name: "Transparent Frosted Glass Mug",
      slug: "transparent-frosted-glass-mug",
      description: "Premium semi-translucent frosted borosilicate glass mug with high-contrast color printing.",
      details: "Capacity: 300ml | Heavy-duty frosted glass | Unique luxury look",
      pricePaise: 32900,
      mrpPaise: 44900,
      discountPercent: 26,
      isAvailable: true,
      isFeatured: false,
      categoryId: categoryMap["customized-mugs"],
      images: [
        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Frosted Glass Standard", sku: "MUG-FRST-01", priceDeltaPaise: 0 },
      ],
    },
  ];

  // 5. Products - Photo Frames
  const frameProducts = [
    {
      name: "LED Backlit Illuminated Glow Frame",
      slug: "led-backlit-illuminated-glow-frame",
      description: "Futuristic crystal acrylic frame with warm LED backlit edge lighting that brings wedding and family portraits alive in the dark.",
      details: "Power: 12V DC Adapter Included | Sizes: 12x18 inch, 16x24 inch | Crystal Clear Front Acrylic",
      pricePaise: 149900,
      mrpPaise: 219900,
      discountPercent: 31,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["premium-photo-frames"],
      images: [
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "12x18 inch Warm White", sku: "FRM-LED-1218", priceDeltaPaise: 0 },
        { name: "16x24 inch Dual Light", sku: "FRM-LED-1624", priceDeltaPaise: 70000 },
      ],
    },
    {
      name: "Waterproof Lifetime Acrylic Frame",
      slug: "waterproof-lifetime-acrylic-frame",
      description: "Zero-fading waterproof sealed frame crafted from 5mm optical grade acrylic with beveled polished borders. Complete moisture protection.",
      details: "Material: UV-resistant Imported Cast Acrylic | Waterproof & Termite Proof | Easy Wall Mount",
      pricePaise: 89900,
      mrpPaise: 129900,
      discountPercent: 30,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["premium-photo-frames"],
      images: [
        "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "8x12 inch", sku: "FRM-WTR-0812", priceDeltaPaise: 0 },
        { name: "12x18 inch", sku: "FRM-WTR-1218", priceDeltaPaise: 40000 },
        { name: "18x24 inch", sku: "FRM-WTR-1824", priceDeltaPaise: 90000 },
      ],
    },
    {
      name: "Royal Teakwood Textured Frame",
      slug: "royal-teakwood-textured-frame",
      description: "Classic handcrafted wooden frame with deep natural grain texture and non-reflective matte photographic lamination.",
      details: "Wood: Seasoned Teak Grain Molding | Glass: Matte Anti-Glare Protection",
      pricePaise: 64900,
      mrpPaise: 89900,
      discountPercent: 27,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["premium-photo-frames"],
      images: [
        "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Dark Walnut Teak", sku: "FRM-WOOD-WAL", priceDeltaPaise: 0 },
        { name: "Antique Gold Teak", sku: "FRM-WOOD-GLD", priceDeltaPaise: 15000 },
      ],
    },
    {
      name: "Personalized Multi-Photo Collage Frame",
      slug: "personalized-multi-photo-collage-frame",
      description: "Designer collage layout accommodating 6 to 12 cherished moments with customized couple names, wedding dates, or quotes.",
      details: "Size: 16x20 inch | Custom Layouts: 8 Photos or 12 Photos | Premium Matte Finish",
      pricePaise: 119900,
      mrpPaise: 169900,
      discountPercent: 29,
      isAvailable: true,
      isFeatured: false,
      categoryId: categoryMap["premium-photo-frames"],
      images: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "8 Photo Grid", sku: "FRM-COL-08", priceDeltaPaise: 0 },
        { name: "12 Photo Mosaic", sku: "FRM-COL-12", priceDeltaPaise: 30000 },
      ],
    },
  ];

  // 6. Sublimation & Customized Gifts
  const giftProducts = [
    {
      name: "Custom Sublimation Cotton-Feel T-Shirt",
      slug: "custom-sublimation-t-shirt",
      description: "Breathable moisture-wicking premium white polyester blend t-shirt with full-color non-fading photographic chest print.",
      details: "Sizes: S, M, L, XL, XXL | Breathable Dri-Fit Fabric | Vibrant Color Retention",
      pricePaise: 39900,
      mrpPaise: 59900,
      discountPercent: 33,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["sublimation-gifts"],
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Size M - White", sku: "TSH-WHT-M", priceDeltaPaise: 0 },
        { name: "Size L - White", sku: "TSH-WHT-L", priceDeltaPaise: 0 },
        { name: "Size XL - White", sku: "TSH-WHT-XL", priceDeltaPaise: 0 },
      ],
    },
    {
      name: "Luxury Velvet Photo Pillow Cushion",
      slug: "luxury-velvet-photo-pillow-cushion",
      description: "Ultra-soft plush velvet cushion with high-definition digital photo print on front and cozy satin back. Includes fluffy fiber filling.",
      details: "Size: 16x16 inch | Concealed zipper | Washable cover",
      pricePaise: 44900,
      mrpPaise: 64900,
      discountPercent: 30,
      isAvailable: true,
      isFeatured: true,
      categoryId: categoryMap["sublimation-gifts"],
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Square 16x16 inch", sku: "CUS-SQR-16", priceDeltaPaise: 0 },
        { name: "Heart Shape 14x14 inch", sku: "CUS-HRT-14", priceDeltaPaise: 5000 },
      ],
    },
    {
      name: "Customized Metal & Acrylic Keychains",
      slug: "customized-keychains-pack",
      description: "Dual-sided crystal acrylic or heavy metal keychain engraved or sublimation printed with your photo and phone number/name.",
      details: "Rust-proof keyring | High scratch resistance | Dual sided print",
      pricePaise: 9900,
      mrpPaise: 14900,
      discountPercent: 33,
      isAvailable: true,
      isFeatured: false,
      categoryId: categoryMap["sublimation-gifts"],
      images: [
        "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Acrylic Rectangle (Pack of 2)", sku: "KEY-ACR-2", priceDeltaPaise: 0 },
        { name: "Heavy Metallic Oval", sku: "KEY-MTL-1", priceDeltaPaise: 5000 },
      ],
    },
  ];

  const allProducts = [...mugProducts, ...frameProducts, ...giftProducts];

  for (const prod of allProducts) {
    const { images, variants, ...prodData } = prod;
    const createdProduct = await prisma.product.upsert({
      where: { slug: prodData.slug },
      update: prodData,
      create: prodData,
    });

    // Seed images
    if (images && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: createdProduct.id } });
      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: createdProduct.id,
            url: images[i],
            isPrimary: i === 0,
            sortOrder: i,
          },
        });
      }
    }

    // Seed variants
    if (variants && variants.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: createdProduct.id } });
      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            productId: createdProduct.id,
            name: v.name,
            sku: v.sku,
            priceDeltaPaise: v.priceDeltaPaise,
          },
        });
      }
    }
  }
  console.log("Products, images, and variants seeded.");

  // 7. Services
  const servicesData = [
    {
      title: "Wedding Photography",
      slug: "wedding-photography",
      category: "Photography",
      description: "Comprehensive coverage of your special day with full-frame Sony Alpha & Canon EOS R series cameras, prime lenses, and artistic candid storytelling.",
      startingPricePaise: 2500000,
      imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Candid & Traditional Coverage", "High-Resolution Edited Portraits", "Custom Photo Album / Karizma Book", "Full Raw Files Backup"]),
      isFeatured: true,
      sortOrder: 1,
    },
    {
      title: "Cinematic Wedding Films",
      slug: "cinematic-wedding-films",
      category: "Videography",
      description: "Breathtaking 4K cinematic wedding highlight films crafted with 3-axis motorized gimbals, cinema color grading, drone aerial footage, and emotional music tracks.",
      startingPricePaise: 3500000,
      imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["4K 60fps Ultra HD Cinema Output", "3-Axis Stabilized Gimbal Work", "Drone Aerial Cinematic Shots", "Teaser Reel (1 Min) & Full Film (20-30 Mins)"]),
      isFeatured: true,
      sortOrder: 2,
    },
    {
      title: "Pre-Wedding Shoots",
      slug: "pre-wedding-shoots",
      category: "Photography",
      description: "Magical couple shoot sessions in scenic outdoor locations or stylized studios with multiple dress changes, drone shots, and storybook compositions.",
      startingPricePaise: 1500000,
      imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Outdoor Scenic Locations", "Drone & Slow-Motion Video Clips", "3-4 Wardrobe Changes", "Instagram Reels Ready Format"]),
      isFeatured: true,
      sortOrder: 3,
    },
    {
      title: "Birthday & Milestone Photography",
      slug: "birthday-photography",
      category: "Photography",
      description: "Vibrant capture of birthday parties, cake cutting, kid portraits, theme decorations, and joyful family moments.",
      startingPricePaise: 500000,
      imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Full Event Coverage", "Instant Photo Prints Available", "Digital Album Delivery", "Theme Backdrop Portraits"]),
      isFeatured: true,
      sortOrder: 4,
    },
    {
      title: "Engagement & Anniversary Shoots",
      slug: "engagement-anniversary-shoots",
      category: "Photography",
      description: "Cherish the ring ceremony and timeless milestones with intimate portraits and celebratory gathering coverage.",
      startingPricePaise: 1000000,
      imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Ring Exchange Close-Ups", "Couple Mini-Session", "Family Group Photos", "Fast 48-Hour Turnaround Preview"]),
      isFeatured: true,
      sortOrder: 5,
    },
    {
      title: "Cinematic Reels & Video Editing",
      slug: "cinematic-reels-editing",
      category: "Videography",
      description: "Fast-paced, viral-ready Instagram Reels and YouTube Shorts edited with trending transitions, sound design, and color grading.",
      startingPricePaise: 300000,
      imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["9:16 Vertical Video Formats", "Beat-Synced Dynamic Cuts", "Custom Color Grading & Titles", "Same-Day Delivery Options"]),
      isFeatured: true,
      sortOrder: 6,
    },
    // Cyber Cafe Services
    {
      title: "PAN Card Application & Correction",
      slug: "pan-card-service",
      category: "CyberCafe",
      description: "Quick, hassle-free submission of new PAN card applications and correction of existing PAN cards with official biometric or OTP verification.",
      startingPricePaise: 15000,
      imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["New PAN Registration", "Name/DOB Correction", "Physical & e-PAN Option", "Tracking Number Provided"]),
      isFeatured: true,
      sortOrder: 7,
    },
    {
      title: "Voter ID Application & Correction",
      slug: "voter-id-service",
      category: "CyberCafe",
      description: "Assistance with Form 6 (New Voter ID), Form 8 (Correction of details / Address Shift), and digital e-EPIC download.",
      startingPricePaise: 10000,
      imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Form 6 New Enrollment", "Address & Photo Updation", "e-EPIC PVC Card Print", "Application Status Tracking"]),
      isFeatured: true,
      sortOrder: 8,
    },
    {
      title: "Government Job & Competitive Exam Forms",
      slug: "online-form-filling",
      category: "CyberCafe",
      description: "Accurate online form submission for SSC, Railway, BPSC, UPSC, Banking, and Army recruitment with exact photo/signature dimension resizing.",
      startingPricePaise: 8000,
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Zero-Error Verification", "Exact Photo/Signature DPI Scaling", "Admit Card Downloading", "Fee Payment Assistance"]),
      isFeatured: true,
      sortOrder: 9,
    },
    {
      title: "High-Speed Color Printing & Document Lamination",
      slug: "printing-scanning-lamination",
      category: "CyberCafe",
      description: "Laser color and monochrome printing, high-resolution document scanning, photocopying, PVC card printing, and hot pouch lamination.",
      startingPricePaise: 500,
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
      featuresJson: JSON.stringify(["Glossy & Matte Photo Paper", "A4 & Legal Color Printing", "Heavy-Duty Pouch Lamination", "High-Resolution PDF Scanning"]),
      isFeatured: true,
      sortOrder: 10,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }
  console.log("Services seeded.");

  // 8. Portfolio Projects
  const portfolioData = [
    {
      title: "Royal Bihari Wedding of Rahul & Ananya",
      slug: "wedding-rahul-ananya",
      category: "Weddings",
      description: "A grand 3-day wedding celebration featuring royal varmala moments, traditional rituals, and emotional vidai captures.",
      clientName: "Rahul & Ananya",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      isFeatured: true,
      sortOrder: 1,
      images: [
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Sunset Whispers: Pre-Wedding in Vaishali Greens",
      slug: "pre-wedding-sunil-priya",
      category: "Pre-Weddings",
      description: "Romantic golden hour portraiture and aerial drone sequence capturing the couple amid lush mango groves and historical arches.",
      clientName: "Sunil & Priya",
      isFeatured: true,
      sortOrder: 2,
      images: [
        "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Aarav's 1st Birthday Extravaganza",
      slug: "birthday-aarav-first",
      category: "Birthdays",
      description: "Jungle-themed birthday celebration loaded with joyful candid portraits, balloon art, and family memories.",
      clientName: "Aarav Sharma",
      isFeatured: true,
      sortOrder: 3,
      images: [
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Ring Ceremony & Sangeet Night: Amit & Pooja",
      slug: "engagement-amit-pooja",
      category: "Engagements",
      description: "High-energy dance performances and romantic ring exchange documented with cinema-grade lighting.",
      clientName: "Amit & Pooja",
      isFeatured: true,
      sortOrder: 4,
      images: [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Cinematic Teaser: The Eternal Vows",
      slug: "cinematic-teaser-eternal-vows",
      category: "Cinematic Films",
      description: "Ultra 4K cinematic film teaser graded with film emulation luts and customized audio design.",
      clientName: "Vikram & Sneha",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      isFeatured: true,
      sortOrder: 5,
      images: [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  for (const proj of portfolioData) {
    const { images, ...projData } = proj;
    const createdProj = await prisma.portfolioProject.upsert({
      where: { slug: projData.slug },
      update: projData,
      create: projData,
    });

    if (images && images.length > 0) {
      await prisma.portfolioImage.deleteMany({ where: { projectId: createdProj.id } });
      for (let i = 0; i < images.length; i++) {
        await prisma.portfolioImage.create({
          data: {
            projectId: createdProj.id,
            url: images[i],
            sortOrder: i,
          },
        });
      }
    }
  }
  console.log("Portfolio projects seeded.");

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

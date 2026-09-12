import { PrismaClient, Role, ResourceStatus, ResourceType } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";
import { SUPPORT_CATEGORIES } from "../src/lib/s3/categories";
import { nextReferenceNumber } from "../src/lib/s3/reference-number";

const prisma = new PrismaClient();

async function main() {
  const categories = new Map<string, string>();
  for (const c of DEFAULT_CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order },
      create: { name: c.name, slug: c.slug, icon: c.icon, order: c.order },
    });
    categories.set(c.slug, cat.id);
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@ridgeoasis.school" },
    update: {},
    create: {
      name: "Ridge Oasis Admin",
      email: "admin@ridgeoasis.school",
      role: Role.SUPER_ADMIN,
      department: "IT",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@ridgeoasis.school" },
    update: {},
    create: {
      name: "Sample Staff Member",
      email: "staff@ridgeoasis.school",
      role: Role.STAFF,
      department: "Academics",
    },
  });

  const sampleResources: Array<{
    title: string;
    description: string;
    content: string;
    categorySlug: string;
    resourceType: ResourceType;
    tags: string[];
  }> = [
    {
      title: "Recoveries – How to Complete a Recovery",
      description: "Step-by-step guide for recording an academic recovery for a learner.",
      content:
        "<h2>Step 1</h2><p>Open the learner's assessment record on Ed-Admin.</p><h2>Step 2</h2><p>Select 'Add Recovery' and enter the recovered mark.</p><h2>Step 3</h2><p>Save and notify the subject teacher.</p>",
      categorySlug: "academics",
      resourceType: ResourceType.PROCEDURE,
      tags: ["recovery", "recoveries", "assessment", "academic", "marks", "ed-admin"],
    },
    {
      title: "How to Create Teamlists on Ed-Admin",
      description: "Guide for creating and managing sports teamlists in Ed-Admin.",
      content:
        "<h2>Step 1</h2><p>Log into Ed-Admin.</p><h2>Step 2</h2><p>Navigate to Sport &gt; Teamlists.</p><h2>Step 3</h2><p>Select the fixture and add selected players.</p>",
      categorySlug: "sport",
      resourceType: ResourceType.PROCEDURE,
      tags: ["teamlist", "teamlists", "team list", "sport", "teams", "ed-admin", "team selection"],
    },
    {
      title: "How to Create a Google Classroom",
      description: "Setting up a new class in Google Classroom for your subject.",
      content:
        "<h2>Step 1</h2><p>Sign into your school Google account.</p><h2>Step 2</h2><p>Open Google Classroom.</p><h2>Step 3</h2><p>Select 'Create Class' and fill in the class details.</p>",
      categorySlug: "google-classroom",
      resourceType: ResourceType.HOW_TO,
      tags: ["google classroom", "classroom", "setup", "class"],
    },
    {
      title: "How to Send a Request to Letitia to Print Certificates",
      description: "Process for requesting learner certificates to be printed.",
      content:
        "<h2>Step 1</h2><p>Prepare your list of learner names and certificate type.</p><h2>Step 2</h2><p>Email Letitia with the request and required date.</p>",
      categorySlug: "administration",
      resourceType: ResourceType.PROCEDURE,
      tags: ["certificates", "certificate printing", "print certificates", "letitia", "learner certificates"],
    },
    {
      title: "How Parents Make a Booking for Parent's Evening",
      description: "Overview of the parent booking process for Parent's Evening.",
      content:
        "<h2>Step 1</h2><p>Parents receive a booking link via email.</p><h2>Step 2</h2><p>They select available time slots per teacher.</p>",
      categorySlug: "administration",
      resourceType: ResourceType.PROCEDURE,
      tags: ["parent's evening", "parents evening", "parent evening", "parent meetings", "bookings"],
    },
    {
      title: "Official School Letterhead",
      description: "Download the current official Ridge Oasis school letterhead.",
      content: "<p>Use this letterhead for all official school correspondence.</p>",
      categorySlug: "school-resources",
      resourceType: ResourceType.BRANDING,
      tags: ["letterhead", "branding", "official documents"],
    },
  ];

  for (const r of sampleResources) {
    const categoryId = categories.get(r.categorySlug);
    if (!categoryId) continue;

    const existing = await prisma.resource.findFirst({ where: { title: r.title } });
    if (existing) continue;

    const resource = await prisma.resource.create({
      data: {
        title: r.title,
        description: r.description,
        content: r.content,
        categoryId,
        resourceType: r.resourceType,
        status: ResourceStatus.PUBLISHED,
        authorId: admin.id,
        approverId: admin.id,
        approvedAt: new Date(),
      },
    });

    for (const tagName of r.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      await prisma.resourceTag.upsert({
        where: { resourceId_tagId: { resourceId: resource.id, tagId: tag.id } },
        update: {},
        create: { resourceId: resource.id, tagId: tag.id },
      });
    }

    await prisma.resourceVersion.create({
      data: {
        resourceId: resource.id,
        versionNumber: 1,
        contentSnapshot: r.content,
        editedById: admin.id,
        changeNotes: "Initial published version (seed data).",
      },
    });
  }

  const synonyms: Array<[string, string]> = [
    ["parent's evening", "parents evening"],
    ["parent's evening", "parent evening"],
    ["parent's evening", "parent meetings"],
    ["recovery", "recoveries"],
    ["recovery", "recover"],
    ["recovery", "assessment recovery"],
    ["teamlist", "team list"],
    ["teamlist", "team lists"],
  ];

  for (const [term, synonym] of synonyms) {
    await prisma.synonym.upsert({
      where: { term_synonym: { term, synonym } },
      update: {},
      create: { term, synonym },
    });
  }

  await prisma.quote.upsert({
    where: { id: "seed-quote-1" },
    update: {},
    create: {
      id: "seed-quote-1",
      text: "Every child deserves a champion.",
      author: "Rita Pierson",
      category: "Teaching",
    },
  });

  await prisma.funFact.upsert({
    where: { id: "seed-fact-1" },
    update: {},
    create: {
      id: "seed-fact-1",
      text: "The word \"school\" comes from the Greek word \"schole\", originally meaning leisure devoted to learning.",
      category: "Education",
    },
  });

  // ---------------- S3 Student Support System ----------------

  const supportHead = await prisma.user.upsert({
    where: { email: "support@ridgeoasis.school" },
    update: {},
    create: {
      name: "Learner Support Head",
      email: "support@ridgeoasis.school",
      role: Role.LEARNER_SUPPORT_HEAD,
      department: "Student Support",
    },
  });

  const supportCategoryIds = new Map<string, string>();
  const supportSubcategoryIds = new Map<string, string>(); // key: "categoryName::subName"

  for (const [index, c] of SUPPORT_CATEGORIES.entries()) {
    const category = await prisma.supportCategory.upsert({
      where: { name: c.name },
      update: { order: index },
      create: { name: c.name, order: index },
    });
    supportCategoryIds.set(c.name, category.id);

    for (const subName of c.subcategories) {
      const sub = await prisma.supportSubcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: subName } },
        update: {},
        create: { categoryId: category.id, name: subName },
      });
      supportSubcategoryIds.set(`${c.name}::${subName}`, sub.id);
    }
  }

  const sampleLearners: Array<{ learnerId: string; firstName: string; surname: string; grade: number; class: string }> = [
    { learnerId: "100234", firstName: "John", surname: "Smith", grade: 8, class: "8A" },
    { learnerId: "100235", firstName: "James", surname: "Smith", grade: 9, class: "9B" },
    { learnerId: "100236", firstName: "Jason", surname: "Smith", grade: 10, class: "10A" },
    { learnerId: "100241", firstName: "Sarah", surname: "Jones", grade: 7, class: "7C" },
  ];

  const learners = new Map<string, string>();
  for (const l of sampleLearners) {
    const learner = await prisma.learner.upsert({
      where: { learnerId: l.learnerId },
      update: {},
      create: l,
    });
    learners.set(l.learnerId, learner.id);
  }

  const existingRequests = await prisma.supportRequest.count();
  if (existingRequests === 0) {
    const johnSmithId = learners.get("100234")!;
    const sarahJonesId = learners.get("100241")!;

    const behaviourCatId = supportCategoryIds.get("Behaviour")!;
    const behaviourSubId = supportSubcategoryIds.get("Behaviour::Disruptive behaviour")!;
    const academicCatId = supportCategoryIds.get("Academic")!;
    const academicSubId = supportSubcategoryIds.get("Academic::Declining academic performance")!;

    const ref1 = await nextReferenceNumber();
    const req1 = await prisma.supportRequest.create({
      data: {
        referenceNumber: ref1,
        learnerId: johnSmithId,
        submittedById: staff.id,
        categoryId: behaviourCatId,
        subcategoryId: behaviourSubId,
        activityType: "Subject",
        activityName: "Mathematics",
        comment:
          "John was repeatedly disruptive during class today, calling out and distracting nearby learners despite two reminders.",
        status: "UNDER_REVIEW",
        priority: "NORMAL",
        reviewedAt: new Date(),
        reviewedById: supportHead.id,
      },
    });

    await prisma.supportNote.create({
      data: {
        supportRequestId: req1.id,
        note: "Spoke to John after class — he mentioned he didn't sleep well. Will monitor over the next week.",
        authorId: supportHead.id,
      },
    });

    await prisma.supportAction.create({
      data: {
        supportRequestId: req1.id,
        actionType: "Spoke to learner",
        createdById: supportHead.id,
      },
    });

    await prisma.supportFollowUp.create({
      data: {
        supportRequestId: req1.id,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        responsibleUserId: supportHead.id,
        notes: "Check in with John's teachers to see if behaviour has settled.",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        action: "S3_REQUEST_SUBMITTED",
        resourceRef: req1.id,
        details: ref1,
      },
    });

    const ref2 = await nextReferenceNumber();
    await prisma.supportRequest.create({
      data: {
        referenceNumber: ref2,
        learnerId: sarahJonesId,
        submittedById: staff.id,
        categoryId: academicCatId,
        subcategoryId: academicSubId,
        activityType: "Subject",
        activityName: "English",
        comment: "Sarah's essay marks have dropped significantly over the last month and she seems disengaged.",
        status: "SUBMITTED",
      },
    });
  }

  console.log("Seed complete.", { admin: admin.email, staff: staff.email, supportHead: supportHead.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

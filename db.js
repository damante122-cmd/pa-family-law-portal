const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS motions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      statute TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      triggers TEXT NOT NULL
    )
  `);

  db.get("SELECT COUNT(*) AS count FROM motions", (err, row) => {
    if (err) {
      console.error("Database check error:", err);
      return;
    }
    // Repopulate with complete directory if missing or updated
    db.run("DELETE FROM motions");
    const stmt = db.prepare("INSERT INTO motions (title, statute, category, description, triggers) VALUES (?, ?, ?, ?, ?)");

    const motions = [
      // Section I: Complaints & Initial Pleading Filings
      ["Complaint in Divorce", "23 Pa.C.S. § 3301", "Initial Pleading", "Initiates dissolution of marriage; frequently includes counts for ED, APL, fees.", "divorce,dissolution,marriage,alimony,equitable distribution"],
      ["Counterclaim in Divorce", "Pa.R.C.P. 1920.15", "Initial Pleading", "Filed by defendant to assert independent counts for divorce, equitable distribution, or custody.", "counterclaim,divorce counterclaim,defense"],
      ["Complaint for Custody", "23 Pa.C.S. § 5321", "Initial Pleading", "Establishes initial legal and physical custody rights for minor children.", "custody complaint,initial custody,custody rights"],
      ["Complaint for Support", "Pa.R.C.P. 1910.11", "Initial Pleading", "Initiates a Domestic Relations Section (DRS) action for child, spousal, or APL support.", "child support,spousal support,support complaint,drs"],
      ["Petition for Protection From Abuse (PFA)", "23 Pa.C.S. § 6106", "Initial Pleading", "Commences an action alleging abuse between family or household members.", "pfa,protection from abuse,domestic violence,abuse"],
      ["Petition for Protection from Sexual Violence or Intimidation (PSVI)", "42 Pa.C.S. § 6204", "Initial Pleading", "Commences safety action against non-family or non-household members.", "psvi,sexual violence,intimidation"],
      ["Petition for Adjudication of Paternity", "23 Pa.C.S. § 5102", "Initial Pleading", "Establishes legal fatherhood status when paternity is contested or unacknowledged.", "paternity,father,dna,biological,acknowledgement,birth certificate"],
      ["Complaint for Grandparent or Third-Party Custody", "23 Pa.C.S. § 5324 / § 5325", "Initial Pleading", "Initiates an action under standing rules for partial or full custody.", "grandparent,third party,standing,partial custody"],
      ["Petition for Voluntary Relinquishment of Parental Rights", "23 Pa.C.S. § 2501", "Initial Pleading", "Filed by a birth parent seeking to give up rights to a child permanently.", "voluntary relinquishment,relinquish rights,adoption prep"],
      ["Petition for Involuntary Termination of Parental Rights", "23 Pa.C.S. § 2511", "Initial Pleading", "Filed to legally sever parental rights based on statutory abandonment, incapacity, or abuse.", "termination of parental rights,involuntary termination,abandonment,tpr"],
      ["Petition for Adoption", "23 Pa.C.S. § 2701", "Initial Pleading", "Initiates a request to establish a permanent, legal parent-child relationship.", "adoption,adopt,legal parent"],
      ["Petition for Change of Name", "54 Pa.C.S. § 701", "Initial Pleading", "Commences formal request to legally change an adult or minor's name.", "name change,change of name"],

      // Section II: Interim & Pre-Trial Financial Relief
      ["Motion for Alimony Pendente Lite (APL)", "23 Pa.C.S. § 3702 / Pa.R.C.P. 1920.31", "Interim Financial", "Requests temporary financial support to maintain economically dependent party during litigation.", "apl,alimony pendente lite,temporary support,interim support"],
      ["Motion for Interim Counsel Fees, Costs, and Expenses", "23 Pa.C.S. § 3702 / Pa.R.C.P. 1920.31", "Interim Financial", "Seeks funding from higher-earning spouse to pay for legal representation and costs.", "counsel fees,attorney fees,interim costs,litigation expenses"],
      ["Motion for Special Relief for Financial Status Quo / Freeze Assets", "Pa.R.C.P. 1920.43", "Interim Financial", "Preserves marital property, prevents asset transfer/dissipation, or retains home possession.", "status quo,freeze assets,dissipation,marital home,special relief financial"],
      ["Inventory and Appraisement", "Pa.R.C.P. 1920.33", "Financial Disclosure", "Mandatory comprehensive filing listing all marital/separate property, debts, and valuations.", "inventory,appraisement,asset list,debt listing"],
      ["Motion to Compel Discovery", "Pa.R.C.P. 4019 / 1920.31", "Discovery", "Seeks court order forcing compliance with Interrogatories or Requests for Production.", "compel,discovery,tax returns,paystubs,bank records,interrogatories"],
      ["Motion for Sanctions for Failure to Comply with Discovery", "Pa.R.C.P. 4019", "Discovery", "Requests financial penalties, evidence exclusion, or default judgment for discovery refusal.", "sanctions,failure to comply,discovery default,penalty"],
      ["Motion for Appointment of a Divorce Master", "Pa.R.C.P. 1920.51", "Master Proceedings", "Refers complex economic claims (Equitable Distribution) or grounds to a hearing officer.", "master,divorce master,master hearing,equitable distribution master"],
      ["Exceptions to Master's Report and Recommendation", "Pa.R.C.P. 1920.55-2", "Master Proceedings", "Formal challenge to a Divorce Master's findings of fact and legal conclusions.", "master exceptions,appeal master,object to master"],

      // Section III: Custody-Specific Motions
      ["Petition for Modification of Custody Order", "23 Pa.C.S. § 5338", "Custody", "Filed to permanently alter custody arrangements based on substantial change in circumstances.", "modification,schedule,school,work hours,job change,relocation,age"],
      ["Petition for Special Relief in Custody", "Pa.R.C.P. 1915.13", "Custody", "Requests immediate, temporary changes, clarifies orders, or addresses operational issues.", "special relief,temporary change,custody clarification,interim schedule"],
      ["Emergency Motion for Special Relief", "Pa.R.C.P. 1915.13", "Emergency", "Immediate temporary relief requested due to imminent safety risks or severe order breach.", "emergency,danger,abuse,police,cps,immediate,risk,safety,threat,abduction"],
      ["Notice of Proposed Relocation", "23 Pa.C.S. § 5337", "Relocation", "Mandatory filing when a parent intends to move, significantly altering non-relocating parent access.", "relocate,moving,out of state,distance,new residence,out of county"],
      ["Counter-Affidavit Regarding Relocation", "23 Pa.C.S. § 5337(d)", "Relocation", "Mandatory responsive filing opposing proposed relocation and/or custody modification.", "oppose relocation,counter affidavit,object to move"],
      ["Motion for Drug and Alcohol Screening / Testing", "Pa.R.C.P. 1915.8 / 23 Pa.C.S. § 5329", "Evaluation", "Requests mandatory drug testing (urine, hair follicle, remote alcohol) for safety issues.", "drug test,alcohol test,screening,substance abuse,hair follicle,sobriety"],
      ["Motion for Psychological Evaluation / Custody Evaluation", "Pa.R.C.P. 1915.8 / 23 Pa.C.S. § 5329", "Evaluation", "Requests comprehensive psychological profile of parents and children by an expert.", "psychological evaluation,custody evaluation,psych eval,expert evaluation"],
      ["Motion for Home Study Evaluation", "Pa.R.C.P. 1915.8", "Evaluation", "Requests formal safety and environment check of residential premises of parents.", "home study,environment check,residence inspection"],
      ["Motion for Supervised Physical Custody / Restricted Contact", "23 Pa.C.S. § 5323", "Custody", "Requests parent's time be restricted to a licensed facility or approved supervisor.", "supervised,restricted contact,supervisor,supervised visitation"],
      ["Motion for Appointment of Guardian Ad Litem (GAL)", "Pa.R.C.P. 1915.11 / 23 Pa.C.S. § 5330", "Evaluation", "Requests independent attorney to represent best interests of minor child.", "gal,guardian,child interest,best interest,high conflict,representation"],
      ["Motion for Appointment of Legal Counsel for Minor Child", "Pa.R.C.P. 1915.11", "Evaluation", "Requests dedicated legal counsel to argue for child's explicit, stated preferences.", "child attorney,counsel for child,child preference"],
      ["Motion to Intervene in Custody Action", "Pa.R.C.P. 1915.6", "Intervention", "Filed by individuals seeking to be added as formal parties based on legal standing.", "intervene,third party intervention,standing intervention"],

      // Section IV: Support & Domestic Relations Motions
      ["Income and Expense Statement", "Pa.R.C.P. 1910.27", "Financial Disclosure", "Mandatory financial disclosure form detailing gross income, deductions, and expenses.", "income statement,expense statement,financial disclosure,paystub"],
      ["Petition for Modification of Support Order", "Pa.R.C.P. 1910.19", "Support", "Filed to adjust monthly child, spousal, or APL support obligations due to material change.", "support modification,change in income,reduce support,increase support"],
      ["Petition to Terminate Support Order", "Pa.R.C.P. 1910.19", "Support", "Filed when child turns 18 and graduates, or upon emancipation or party reconciliation.", "terminate support,emancipation,age 18,graduation"],
      ["Motion for Paternity Genetic / DNA Testing", "23 Pa.C.S. § 4343", "Support", "Requests court-ordered DNA testing in support proceedings to establish parentage.", "dna test,genetic testing,paternity test"],
      ["Demand for Hearing De Novo", "Pa.R.C.P. 1910.11 / 1910.12", "Support Appeal", "Appeal motion filed following office conference, demanding full hearing before a Judge.", "de novo,appeal conference,de novo hearing,judge hearing"],
      ["Exceptions to Support Hearing Officer's Report", "Pa.R.C.P. 1910.12", "Support Appeal", "Challenges findings of a Domestic Relations hearing officer before a trial court judge.", "support exceptions,hearing officer report,object support report"],
      ["Motion to Dismiss Support Complaint / Objections to Guidelines", "Pa.R.C.P. 1910.11", "Support", "Procedural challenge arguing support action lacks legal basis or deviates improperly.", "dismiss support,guideline deviation,support objections"],
      ["Motion for Special Relief in Support Matters", "Pa.R.C.P. 1910.26", "Support", "Requests immediate adjustment for extraordinary medical bills or tuition emergencies.", "support special relief,medical expense,tuition emergency"],

      // Section V: Enforcement, Compliance & Sanctions
      ["Petition for Civil Contempt for Non-Compliance with Custody Order", "Pa.R.C.P. 1915.12 / 23 Pa.C.S. § 5323(g)", "Enforcement", "Filed when parent willfully violates active custody schedule, seeking fines or make-up time.", "violation,denied,refused,late,missed,withheld,contempt,breach"],
      ["Petition for Civil Contempt for Non-Compliance with Support Order", "Pa.R.C.P. 1910.21", "Enforcement", "Filed for willful non-payment of court-ordered support obligations.", "support contempt,unpaid support,non payment,arrears contempt"],
      ["Motion for Bench Warrant", "Pa.R.C.P. 1910.13-1 / 1915.12", "Enforcement", "Requests arrest warrant when party willfully fails to appear for court hearing.", "bench warrant,arrest warrant,failure to appear,missed hearing"],
      ["Motion to Enforce Marriage Settlement Agreement (MSA)", "23 Pa.C.S. § 3105", "Enforcement", "Compels execution of obligations (property sales, account transfers) signed in MSA contract.", "enforce msa,marriage settlement agreement,enforce contract,property transfer"],
      ["Motion for Seizure / Sequestration of Assets", "23 Pa.C.S. § 3502 / § 4351", "Enforcement", "Freezes or seizes bank accounts/property to satisfy unpaid support or ED awards.", "seizure,sequestration,asset freeze,attach bank account"],
      ["Motion for Wage Attachment / Income Withholding Order", "23 Pa.C.S. § 4348", "Enforcement", "Direct garnishment of earnings from employer to satisfy active support or alimony.", "wage attachment,income withholding,garnishment,employer attachment"],
      ["Motion to Reduce Arrears to Judgment", "23 Pa.C.S. § 4352", "Enforcement", "Converts unpaid, overdue support balances into an enforceable civil judgment.", "reduce to judgment,arrears judgment,judgment lien,support arrears"],

      // Section VI: Procedural Pre-Trial & Trial Actions
      ["Praecipe for Entry of Appearance", "Pa.R.C.P. 1012", "Procedural", "Formal filing notifying court and opposing party of pro se or attorney representation.", "entry of appearance,pro se appearance,attorney appearance"],
      ["Preliminary Objections", "Pa.R.C.P. 1028 / 1920.11", "Procedural", "Dismisses complaint based on improper service, lack of jurisdiction, or insufficient legal facts.", "preliminary objections,improper service,lack of jurisdiction,demurrer"],
      ["Motion for Continuance", "Pa.R.C.P. 1920.56 / 1915.4-3", "Procedural", "Written request to formally postpone a trial, master's hearing, or conciliation.", "continuance,postpone,reschedule,delay hearing"],
      ["Motion to Withdraw Appearance of Counsel", "Pa.R.C.P. 1012", "Procedural", "Filed by attorney seeking formal court permission to cease representation.", "withdraw counsel,attorney withdrawal,leave to withdraw"],
      ["Motion for Leave to Amend Pleading", "Pa.R.C.P. 1033", "Procedural", "Requests authorization to correct or add counts to a previously filed complaint/petition.", "amend pleading,amend complaint,amend petition"],
      ["Motion for Protective Order", "Pa.R.C.P. 4012", "Procedural", "Limits discovery to prevent annoyance or disclosure of sensitive medical/mental records.", "protective order,restrict discovery,privacy protection"],
      ["Motion to Quash Subpoena", "Pa.R.C.P. 234.4", "Procedural", "Asks court to void an overly broad, burdensome, or illegal third-party subpoena.", "quash subpoena,void subpoena,invalid subpoena"],
      ["Motion for Pre-Trial Conference", "Pa.R.C.P. 1915.4-2 / 1920.42", "Procedural", "Assembles parties to iron out settlement terms, stipulate to facts, and organize exhibits.", "pre trial conference,settlement conference,trial prep"],
      ["Motion in Limine", "Pa.R.C.P. 207.1", "Trial", "Asks court to exclude irrelevant or improperly obtained evidence from trial.", "motion in limine,exclude evidence,suppress evidence"],
      ["Motion for Judgment on the Pleadings / Summary Judgment", "Pa.R.C.P. 1034 / 1035.2", "Trial", "Asks court for final judgment without trial when no material factual issues exist.", "summary judgment,judgment on pleadings,no material fact"],
      ["Motion to Consolidate Actions", "Pa.R.C.P. 213", "Procedural", "Requests separate actions involving same family be joined under single master docket.", "consolidate,join actions,combine cases"],
      ["Motion for Bifurcation of Divorce", "Pa.R.C.P. 1920.52(c)", "Divorce", "Requests court sever legal divorce decree from unresolved property division matters.", "bifurcation,bifurcate divorce,sever divorce"],
      ["Affidavit of Consent / § 3301(c) Filings", "23 Pa.C.S. § 3301(c)", "Divorce", "Filed after 90-day waiting period demonstrating mutual consent to enter divorce decree.", "affidavit of consent,3301c,mutual consent divorce"],
      ["Affidavit of Separation / § 3301(d) Counter-Affidavit", "23 Pa.C.S. § 3301(d)", "Divorce", "Filings asserting or contesting a 1-year irretrievable breakdown separation period.", "3301d,affidavit of separation,1 year separation"],
      ["Praecipe to Transmit the Record", "Pa.R.C.P. 1920.42", "Divorce", "Administrative cover motion prompting court to sign final Divorce Decree.", "praecipe to transmit,transmit record,final divorce decree"],

      // Section VII: Appellate & Post-Trial Motions
      ["Motion for Reconsideration", "Pa.R.C.P. 1930.2", "Post-Trial", "Filed within 30 days asking presiding judge to review decision to fix clear errors.", "reconsideration,reconsider order,fix error"],
      ["Notice of Appeal to the Superior Court of Pennsylvania", "Pa.R.A.P. 902", "Appeal", "Commences formal appellate review by higher state court.", "notice of appeal,superior court appeal,appeal order"],
      ["Statement of Matters Complained of on Appeal (Rule 1925(b))", "Pa.R.A.P. 1925(b)", "Appeal", "Mandatory itemized outline specifying exactly what errors trial judge committed.", "1925b,statement of errors,matters complained of"],
      ["Motion to Stay Pending Appeal", "Pa.R.A.P. 1701", "Appeal", "Requests court pause enforcement of active trial order while appellate court reviews.", "stay pending appeal,pause order,freeze enforcement"],

      // Section VIII: Mandatory Universal Administrative Filings
      ["Proposed Order of Court", "Pa.R.C.P. 1930.1", "Administrative", "Mandatory layout accompanying every petition/motion drafted for judge's signature.", "proposed order,draft order"],
      ["Certificate of Service", "Pa.R.C.P. 440", "Administrative", "Documents date, location, and mechanism by which opposing party was served.", "certificate of service,proof of service,service document"],
      ["Confidential Information Form (CIF)", "Public Access Policy", "Administrative", "Mandated form isolating sensitive details (SSNs, financial accounts, DOBs) from public view.", "cif,confidential information form,ssn protection"],
      ["Confidential Document Form (CDF)", "Public Access Policy", "Administrative", "Used to attach sensitive financial tax returns, bank statements, and medical evaluations.", "cdf,confidential document form,tax return attachment,medical record attachment"],
      ["Criminal Record/Abuse History Verification", "23 Pa.C.S. § 5329 / Pa.R.C.P. 1915.3-2", "Custody Administrative", "Mandatory disclosure form detailing background of household members in custody actions.", "criminal record verification,abuse history,background check"],
      ["Praecipe to Discontinue / Settle Action", "Pa.R.C.P. 229", "Administrative", "Formally withdraws or closes open petition, complaint, or judgment upon settlement.", "discontinue,settle action,withdraw petition,close case"]
    ];

    motions.forEach(m => stmt.run(m));
    stmt.finalize();
    console.log(`PA Custody Motions Database updated with ${motions.length} entries.`);
  });
});

module.exports = db;

#!/usr/bin/env python3
"""Draft crossword vocabulary from current Science banks for editorial review.

The authoring pass extracts concise scientific concepts, rewrites question prompts
as clues, and uses answer definitions when a question explicitly asks for a term.
It does not copy answer sentences into grid entries. Review every generated clue.
"""
import json,re,subprocess,hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'crossword-data/science'
STOP={'a','an','the','this','that','these','those','it','they','he','she','we','to','of','in','on','at','from','with','by','as','is','are','was','were','do','does','did','which','what','who','when','where','why','how','can','could','would','should','will','has','have','had','its','their','there','here','one','some','many','most','much','more','less','same','different','best','main','correct','following','statement','explanation','reason','factor','process','way','type','kind'}
BAD_START=re.compile(r'^(?:it|its|they|their|this|these|those|to|because|when|while|if|by|in order|which|that|there|as)\b',re.I)
BAD_ANSWER=re.compile(r'^(?:expected|plausible|reasonable|likely|supported|cautious|interpretation|weak|strong|much|blue|valence|one[- ](?:half|fourth|third)|zero|negative|positive|west|east|north|south|both|neither|some|many|most|same|different|best|worse|better|the|a|an|its|their)\b',re.I)
GENERIC={'CELL','CELLS','ENERGY','SYSTEM','SYSTEMS','ORGANISM','ORGANISMS','PROCESS','PROCESSES','FACTOR','FACTORS','MATERIAL','MATERIALS','STRUCTURE','STRUCTURES','CHANGE','CHANGES','FUNCTION','FUNCTIONS','PART','PARTS','THING','THINGS','RESULT','RESULTS','CONDITION','CONDITIONS','INFORMATION','SCIENCE','SCIENTIFIC','STUDY','STUDIES','QUESTION','ANSWER','EXAMPLE','MODEL','MODELS','CONCERN','IDEA','REASON','EFFECT','WAY','TYPE','KIND','FEATURE','PROPERTY','AMOUNT','NUMBER','VALUE','CAUSE','PURPOSE','ROLE','BENEFIT','PROBLEM'}
BAD_TERM=re.compile(r'\b(?:expected|plausible|likely|reasonable|conclusion|explanation|assume|suppose|follows|suggests|indicates|because|although|which|what|where|when|would|could|should|typically|usually|generally|appropriate|incorrect|correct|example|answer|means?|makes?|made|causes?|caused|occurs?|occurred|explains?|provides?|shows?|gives?|helps?|allows?|requires?|limits?|leaves?|shrinks?|moves?|moved|fits?|results?|supports?|transfers?|reduces?|promotes?|enters?|exits?|maintains?|regulates?|changes?|affects?|involves?|depends?|prevents?|represents?|describes?|forms?|becomes?|remain|remains|stays?|push(?:es|ed)?|pulls?|acts?|produces?|measures?|uses?|used|using|accelerates?|is|are|was|were|has|have|had|do|does|did|can|will|having|being)\b',re.I)
TERM_FIXES={
 'selectively permeable membranes':('Selective permeability','Membrane property that allows some substances to cross more readily than others.'),
 'key statement of cell theory':('Cell theory','States that living things are made of cells and that cells come from existing cells.'),
 'cell specialization':('Cell specialization','Process by which cells develop structures suited to particular functions.'),
 'prokaryotic':('Prokaryote','Cell type that lacks a membrane-bound nucleus.'),
 'surface area-to-volume ratio':('Surface area-to-volume ratio','Relationship between a cell’s exchange surface and its internal volume.'),
 'surface area':('Surface area','Measure of the total outer area available for exchange.'),
 'matter during photosynthesis':('Conservation of matter','Photosynthesis rearranges atoms; it does not create or destroy them.'),
 'role of fermentation':('Fermentation','Anaerobic pathway that regenerates molecules needed for glycolysis.'),
 'version of a gene':('Allele','One of two or more forms of a gene.'),
 'dominant not mean more common':('Dominance','Allele relationship describing expression in a heterozygote.'),
 'siblings from the same parents':('Genetic variation','Differences that can arise from different combinations of inherited alleles.'),
 'dominant phenotype':('Dominant phenotype','Trait expressed in a heterozygote under a complete-dominance model.'),
 'adaptation in evolutionary biology':('Adaptation','Heritable feature that improves reproductive success in a particular environment.'),
 'trait beneficial in one habitat':('Local adaptation','Heritable feature that improves success in a particular environment.'),
 'formation of distinct species':('Speciation','Evolutionary process in which populations become separate species.'),
 'normal mitotic':('Mitosis','Nuclear division that usually preserves chromosome number.'),
 'three-base sequence':('Codon','Three-nucleotide sequence in messenger RNA that specifies an amino acid or stop signal.'),
 'translation in molecular biology':('Translation','Process that uses an RNA message to assemble a polypeptide.'),
 'dna substitution alter a protein':('Substitution mutation','DNA change in which one nucleotide is replaced by another.'),
 'encoded amino acid remains alanine':('Silent mutation','DNA change that does not alter the encoded amino acid.'),
 'inserting one base':('Frameshift mutation','Mutation that shifts how nucleotide triplets are grouped.'),
 'sharing a genus':('Genus','Taxonomic rank that groups closely related species.'),
 'shared derived feature':('Synapomorphy','Shared derived trait used to identify a group in evolutionary classification.'),
 'follow the bird branch':('Dichotomous key','Identification tool that guides users through paired choices.'),
 'receiver of energy through feeding':('Consumer','Organism that obtains energy by eating other organisms.'),
 'matter cycling':('Matter cycling','Movement of matter through living things and the environment.'),
 'losing one species':('Food web','Network showing feeding relationships among organisms in an ecosystem.'),
 'movement into a population':('Immigration','Movement of individuals into a population.'),
 'movement out of a population':('Emigration','Movement of individuals out of a population.'),
 'exponential':('Exponential growth','Population growth in which the rate increases as the population grows.'),
 'agent capable of causing disease':('Pathogen','Disease-causing biological agent.'),
 'not all microorganisms harmful':('Microbiome','Community of microorganisms living in a particular environment.'),
 'decomposer microorganisms':('Decomposer','Organism that breaks down dead material and returns nutrients to the environment.'),
 'photosynthetic protist':('Protist','Eukaryote that is not classified as an animal, plant, or fungus.'),
 'body systems':('Organ system','Group of organs that work together to carry out major functions.'),
 'moving the attached bone':('Muscle contraction','Shortening or tension development that can move a bone at a joint.'),
 'transport by circulation':('Circulatory system','Body system that transports blood, gases, nutrients, and wastes.'),
 'receptor in cell signaling':('Receptor','Molecule that binds a specific signal and can trigger a cellular response.'),
 'artery not defined simply':('Artery','Blood vessel that carries blood away from the heart.'),
 'thin alveolar':('Alveolus','Thin-walled air sac where gases diffuse between air and blood.'),
 'working muscle':('Cellular respiration','Process that releases usable energy from fuel molecules in cells.'),
 'atom electrically neutral':('Electrical neutrality','Condition in which positive and negative charges balance.'),
 'losing an electron':('Positive ion','Charged atom or group formed when electrons are lost.'),
 'increasing atomic number':('Atomic number','Number of protons in an atom’s nucleus.'),
 'atomic radius generally':('Atomic radius','Measure related to the size of an atom.'),
 'electronegativity generally':('Electronegativity','Measure of an atom’s attraction for shared electrons in a bond.'),
 'major feature of metallic bonding':('Metallic bond','Attraction between metal ions and mobile valence electrons.'),
 'changing neutron number':('Isotope','Atom of an element with a different number of neutrons.'),
 'conservation of atoms':('Conservation of atoms','Chemical reactions rearrange atoms without creating or destroying them.'),
 'coefficient 3 in 3co₂':('Coefficient','Number placed before a formula to show the amount of a substance.'),
 'solid changing to liquid':('Melting','Phase change in which a solid becomes a liquid.'),
 'gas changing to liquid':('Condensation','Phase change in which a gas becomes a liquid.'),
 'solid changing directly to gas':('Sublimation','Phase change in which a solid becomes a gas without becoming liquid first.'),
 'density remains the same':('Intensive property','Property that does not depend on the amount of a sample.'),
 'formation of a new substance':('Chemical change','Change that produces one or more substances with different compositions.'),
 'homogeneous mixture of substances':('Solution','Homogeneous mixture in which one or more solutes are dispersed in a solvent.'),
 'filtration alone':('Filtration','Separation method that uses a barrier to retain solid particles from a fluid.'),
 'pure element':('Element','Pure substance made of only one type of atom.'),
 'pure compound':('Compound','Pure substance made of two or more elements chemically combined.'),
 'balancing support mass conservation':('Balanced equation','Chemical equation with equal numbers of each type of atom on both sides.'),
 'divide mass by molar mass':('Mole calculation','Amount of substance found by dividing mass by molar mass.'),
 'donates a proton':('Brønsted–Lowry acid','Particle that donates a proton in an acid–base reaction.'),
 'accepts a proton':('Brønsted–Lowry base','Particle that accepts a proton in an acid–base reaction.'),
 'mol per liter per second':('Reaction rate','Change in concentration per unit time.'),
 'biological catalyst':('Enzyme','Biological catalyst that speeds reactions by lowering activation energy.'),
 'higher temperature':('Temperature effect','Higher temperature usually increases reaction rate by increasing particle kinetic energy.'),
 'equilibrium not mean a reaction':('Dynamic equilibrium','State in which forward and reverse reaction rates are equal.'),
 'specific heat capacity':('Specific heat capacity','Energy required to raise the temperature of a unit mass by one degree.'),
 'object accelerate':('Acceleration','Change in velocity per unit time.'),
 'object’s position remains constant':('Rest','State in which an object’s position does not change relative to a reference point.'),
 "object's position remains constant":('Rest','State in which an object’s position does not change relative to a reference point.'),
 'friction commonly':('Friction','Force that opposes relative motion between surfaces in contact.'),
 'doubling speed':('Kinetic energy','Energy of motion; for a fixed mass it varies with the square of speed.'),
 'raising an object':('Gravitational potential energy','Energy associated with an object’s position in a gravitational field.'),
 'floating object bob':('Wave','Disturbance that transfers energy while matter mainly oscillates locally.'),
 'series with the component':('Ammeter','Instrument connected in series to measure electric current.'),
 'total momentum stay constant':('Conservation of momentum','Total momentum remains constant in an isolated system.'),
 'time for one complete orbit':('Orbital period','Time required for one complete orbit.'),
 'motion under gravity alone':('Free fall','Motion in which gravity is the only force acting.'),
 'circular-motion requirement':('Centripetal acceleration','Inward acceleration required to keep an object moving in a circle.'),
 'static friction from the road':('Centripetal force','Inward net force that keeps an object moving along a circular path.'),
 'steel ship float':('Buoyancy','Upward force exerted by a fluid on an immersed object.'),
 'appropriate action':('Laboratory safety','Practices that reduce risks while working with materials and equipment.'),
 'ask the teacher before proceeding':('Safety protocol','Approved steps for responding to uncertainty or hazards in a laboratory.'),
 'long hair safety':('Laboratory safety','Practice of securing loose hair near flames, chemicals, or moving equipment.'),
 'unlabeled chemical':('Chemical identification','A chemical without a clear label must not be used.'),
 'clear water not prove it':('Water quality','Multiple physical, chemical, and biological measures are needed to assess water.'),
 'fecal-indicator organism':('Fecal indicator','Microorganism monitored as evidence that water may have been contaminated by fecal material.'),
 'excess nitrate':('Nutrient pollution','Excess nutrients can cause rapid algae and plant growth in water.'),
 'biochemical oxygen demand':('Biochemical oxygen demand','Estimate of oxygen used by microbes as they decompose organic matter.'),
 'baseline measurement':('Baseline','Reference measurement used to compare later observations.'),
 'conductivity measurements':('Conductivity','Measure that can indicate dissolved ions in a water sample.'),
 'dissolved oxygen':('Dissolved oxygen','Oxygen gas in water that is available to aquatic organisms.'),
 'ph':('pH','Scale that indicates how acidic or basic a solution is.'),
 'fecal indicator organism':('Fecal indicator','Microorganism measured as evidence of possible fecal contamination in water.'),
 'baseline measurement in a water':('Baseline','Reference measurement used to compare later observations.'),
 'neap tide':('Neap tide','Tide with a small tidal range near first- or third-quarter moon.'),
 'inner planets':('Inner planets','Four rocky planets closest to the Sun: Mercury, Venus, Earth, and Mars.'),
 'mass':('Mass','Measure of the amount of matter in an object.'),
 'newton':('Newton','SI unit of force.'),
 'newton’s third law':("Newton’s third law",'Forces between interacting objects are equal in magnitude and opposite in direction.'),
 'meters per second':('Meters per second','SI-derived unit commonly used to measure speed or velocity.'),
 'direction':('Direction','Orientation of motion, needed to describe a velocity vector.'),
 'rest':('Rest','State in which position does not change relative to a chosen reference point.'),
 'plant cell':('Plant cell','Eukaryotic cell with features such as a cell wall and a large central vacuole.'),
 'oxygen':('Oxygen','Element whose gas is used in aerobic cellular respiration.'),
 'temperature':('Temperature','Measure related to the average kinetic energy of particles.'),
 'ion':('Ion','Atom or group of atoms with a net electric charge.'),
 'solution':('Solution','Homogeneous mixture in which a solute is dispersed in a solvent.'),
 'pressure':('Pressure','Force distributed over a unit area.'),
 'skin':('Skin','Organ and protective barrier that forms much of the integumentary system.'),
 'tissue':('Tissue','Group of similar cells and associated material performing related functions.'),
 'organ':('Organ','Structure composed of multiple tissues working together.'),
 'sample in a field study':('Sample','Subset of a population selected for observation or measurement.'),
 'quadrat commonly used for':('Quadrat','Frame used to sample organisms in a defined area.'),
 'random sampling intended to reduce':('Random sampling','Method that gives members of a population a chance of selection.'),
 'precision in repeated measurements':('Precision','Closeness of agreement among repeated measurements.'),
 'final plant height':('Dependent variable','Outcome measured in response to a change in the independent variable.'),
 'conclusion uncertain':('Confounding variable','Factor that changes alongside the independent variable and complicates interpretation.'),
 'bar graph':('Bar graph','Graph that compares values across separate categories.'),
 'line graph':('Line graph','Graph often used to show how a quantity changes over an ordered interval.'),
 'main concern':('Misleading graph scale','A truncated axis can exaggerate visual differences between data values.'),
 'particulate matter in air':('Particulate matter','Tiny solid particles or liquid droplets suspended in air.'),
 'primary air pollutant':('Primary pollutant','Pollutant emitted directly from a source.'),
 'secondary air pollutant':('Secondary pollutant','Pollutant formed through reactions in the atmosphere.'),
 'temperature inversion':('Temperature inversion','Atmospheric condition in which warmer air lies above cooler air near the surface.'),
 'exposure in hazard assessment':('Exposure','Presence of people or assets where a hazard could occur.'),
 'vulnerability':('Vulnerability','Susceptibility to harm when exposed to a hazard.'),
 'edge effect in a habitat':('Edge effect','Change in environmental conditions near a habitat boundary.'),
 'wildlife corridor':('Wildlife corridor','Habitat connection that allows organisms to move between separated areas.'),
 'ecological restoration':('Ecological restoration','Process of assisting the recovery of a degraded ecosystem.'),
 'reference ecosystem':('Reference ecosystem','Comparison used to guide ecological restoration goals.'),
 'renewable resource':('Renewable resource','Resource replenished naturally on a timescale relevant to its use.'),
 'source reduction':('Source reduction','Preventing waste before it is created.'),
 'reuse':('Reuse','Using a product again without first processing it into raw material.'),
 'composting':('Composting','Managed decomposition of suitable organic material.'),
 'system boundary':('System boundary','Defined edge used to identify what is inside or outside a system.'),
 'input to an environmental system':('System input','Matter or energy entering a system.'),
 'amount accumulated within a system':('System stock','Amount of matter or energy stored within a system at a given time.'),
 'environmental threshold':('Environmental threshold','Point beyond which a system may shift to a different condition.'),
 'feedbacks':('Feedback loop','Process in which system outputs affect later inputs or behavior.'),
 'protostar':('Protostar','Early stage in star formation before sustained hydrogen fusion begins.'),
 'luminosity':('Luminosity','Total energy emitted by a star per unit time.'),
 'barred spiral galaxy':('Barred spiral galaxy','Spiral galaxy whose arms extend from a central bar-shaped region.'),
 'cosmological redshift':('Cosmological redshift','Increase in observed wavelength associated with the expansion of space.'),
 'cosmic microwave background':('Cosmic microwave background','Radiation left from the early universe and observed across the sky.'),
 'dark matter':('Dark matter','Matter inferred from gravitational effects but not observed through emitted light.'),
 'robotic space probe':('Space probe','Uncrewed spacecraft sent to investigate objects or regions in space.'),
 'remote sensing':('Remote sensing','Collecting information about an object without direct contact.'),
 'natural hazard':('Natural hazard','Natural process that has the potential to cause harm.'),
 'source reduction':('Source reduction','Preventing waste before it is created.'),
 'solar energy':('Solar energy','Energy from sunlight.'),
 'energy from earth’s internal heat':('Geothermal energy','Energy obtained from Earth’s internal heat.'),
 'carrying capacity':('Carrying capacity','Population size an environment can support over time.'),
 'genus':('Genus','Taxonomic rank grouping closely related species.'),
 'aquifer':('Aquifer','Permeable geologic unit that stores and transmits groundwater.'),
 'water table':('Water table','Upper surface of the saturated groundwater zone.'),
 'groundwater recharge':('Groundwater recharge','Water entering and replenishing an aquifer.'),
 'lithosphere':('Lithosphere','Rigid outer layer of Earth made of the crust and uppermost mantle.'),
 'transform boundary':('Transform boundary','Plate boundary where two plates slide past one another.'),
 'pangaea':('Pangaea','Ancient supercontinent that included nearly all of Earth’s land.'),
 'focus':('Earthquake focus','Point inside Earth where an earthquake rupture begins.'),
 'epicenter':('Epicenter','Point on Earth’s surface directly above an earthquake’s focus.'),
 'albedo':('Albedo','Fraction of incoming radiation reflected by a surface.'),
 'greenhouse effect':('Greenhouse effect','Warming caused when atmospheric gases absorb and emit infrared radiation.'),
 'geothermal energy':('Geothermal energy','Energy from Earth’s internal heat.'),
 'magma':('Magma','Molten or partly molten rock beneath Earth’s surface.'),
 'lava':('Lava','Magma that reaches Earth’s surface.'),
 'tephra':('Tephra','Fragments of volcanic rock, minerals, and glass thrown into the air.'),
 'unconformity':('Unconformity','Boundary representing missing time in the geologic record.'),
 'trace fossil':('Trace fossil','Preserved evidence of an organism’s activity.'),
 'climate':('Climate','Long-term patterns and averages of atmospheric conditions.'),
 'transpiration':('Transpiration','Release of water vapor from plant leaves.'),
 'condensation':('Condensation','Change from water vapor to liquid droplets.'),
 'evaporation':('Evaporation','Change from liquid water to water vapor at a surface.'),
 'species richness':('Species richness','Number of species present in a community.'),
 'endemic species':('Endemic species','Species native to a limited geographic area.'),
 'ecosystem service':('Ecosystem service','Benefit people receive from ecological processes.'),
 'genetic diversity':('Genetic diversity','Variation in inherited traits within a species.'),
 'habitat fragmentation':('Habitat fragmentation','Division of habitat into smaller, separated patches.'),
 'natural selection':('Natural selection','Process in which heritable traits affecting reproduction change in frequency.'),
 'genetic drift':('Genetic drift','Random change in allele frequencies, strongest in small populations.'),
 'gene flow':('Gene flow','Movement of alleles between populations.'),
 'photosynthesis':('Photosynthesis','Process that uses light energy to build sugars from carbon dioxide and water.'),
 'cellular respiration':('Cellular respiration','Process that releases usable energy from organic molecules.'),
 'mitochondria':('Mitochondrion','Organelle where most aerobic cellular respiration occurs.'),
 'chloroplast':('Chloroplast','Organelle where photosynthesis occurs in plants and algae.'),
 'cytoplasm':('Cytoplasm','Cell contents outside the nucleus and inside the plasma membrane.'),
 'nucleus':('Nucleus','Membrane-bound organelle that contains most eukaryotic DNA.'),
 'ribosome':('Ribosome','Cell structure that assembles proteins.'),
 'plasma membrane':('Plasma membrane','Boundary that regulates exchange between a cell and its surroundings.'),
 'cell wall':('Cell wall','Rigid outer layer that supports many plant, fungal, and bacterial cells.'),
 'golgi apparatus':('Golgi apparatus','Organelle that modifies, sorts, and packages many proteins.'),
 'rough endoplasmic reticulum':('Rough endoplasmic reticulum','Membrane network with attached ribosomes that helps process proteins.'),
 'large central vacuole':('Central vacuole','Plant-cell compartment that stores water and helps maintain pressure.'),
 'central vacuole':('Central vacuole','Plant-cell compartment that stores water and helps maintain pressure.'),
 'tissue':('Tissue','Group of similar cells and associated material performing related functions.'),
 'organ':('Organ','Structure composed of multiple tissues working together.'),
 'negative feedback':('Negative feedback','Response that counteracts a change in a regulated condition.'),
 'osmosis':('Osmosis','Net movement of water across a selectively permeable membrane.'),
 'diffusion':('Diffusion','Net movement of particles from higher to lower concentration.'),
 'active transport':('Active transport','Movement of substances against a concentration gradient using cellular energy.'),
 'facilitated diffusion':('Facilitated diffusion','Movement down a concentration gradient through membrane proteins.'),
 'endocytosis':('Endocytosis','Cellular intake of material by enclosing it in a membrane vesicle.'),
 'exocytosis':('Exocytosis','Release of vesicle contents when a vesicle fuses with the cell membrane.'),
 'transport proteins':('Transport protein','Membrane protein that helps specific substances cross a cell membrane.'),
 'sweating':('Sweating','Cooling response in which evaporation from skin transfers heat away.'),
 'allele':('Allele','One of two or more forms of a gene.'),
 'genotype':('Genotype','Genetic makeup of an organism at one or more gene locations.'),
 'phenotype':('Phenotype','Observable characteristics resulting from genes and environmental effects.'),
 'heterozygous':('Heterozygous','Having two different alleles at a particular gene location.'),
 'punnett square':('Punnett square','Diagram used to show possible allele combinations in offspring.'),
 'segregation':('Segregation','Separation of paired alleles during gamete formation.'),
 'incomplete dominance':('Incomplete dominance','Inheritance pattern in which a heterozygote has an intermediate phenotype.'),
 'sister chromatids':('Sister chromatids','Identical chromosome copies joined before they separate.'),
 'homologous chromosomes':('Homologous chromosomes','Chromosome pair with the same genes at corresponding locations.'),
 'crossing over':('Crossing over','Exchange of DNA between nonsister chromatids of homologous chromosomes.'),
 'prophase i':('Prophase I','Meiotic stage when homologous chromosomes pair and crossing over can occur.'),
 'metaphase i':('Metaphase I','Meiotic stage when homologous chromosome pairs align at the cell center.'),
 'mitosis':('Mitosis','Nuclear division that usually preserves chromosome number.'),
 'meiosis':('Meiosis','Cell division that produces haploid cells from a diploid cell.'),
 'cytokinesis':('Cytokinesis','Division of the cytoplasm into daughter cells.'),
 'transcription':('Transcription','Synthesis of RNA from a DNA template.'),
 'translation':('Translation','Use of an RNA message to assemble a polypeptide.'),
 'gene':('Gene','DNA sequence that contributes to a functional product.'),
 'ribose':('Ribose','Five-carbon sugar found in RNA.'),
 'uracil':('Uracil','RNA base that generally replaces thymine.'),
 'codon':('Codon','Three-nucleotide sequence in messenger RNA that specifies an amino acid or stop.'),
 'trna':('tRNA','RNA molecule that carries an amino acid to a ribosome.'),
 'gene':('Gene','DNA sequence that contributes to a functional product.'),
 'antigen':('Antigen','Molecular feature recognized by immune receptors.'),
 'vector':('Vector','Organism that carries a pathogen between hosts.'),
 'virus':('Virus','Noncellular infectious agent that reproduces using host-cell machinery.'),
 'bacteria':('Bacteria','Single-celled prokaryotes that lack a membrane-bound nucleus.'),
 'fungi':('Fungus','Eukaryotic organism group that includes yeasts and molds.'),
 'binary fission':('Binary fission','Asexual division in which one prokaryotic cell becomes two cells.'),
 'microbiome':('Microbiome','Community of microorganisms living in a particular environment.'),
 'pathogen':('Pathogen','Biological agent capable of causing disease.'),
 'alveoli':('Alveoli','Small lung air sacs where oxygen and carbon dioxide are exchanged.'),
 'hemoglobin':('Hemoglobin','Oxygen-binding protein in red blood cells.'),
 'capillaries':('Capillaries','Small blood vessels where exchange with tissues occurs.'),
 'arteries':('Arteries','Blood vessels that carry blood away from the heart.'),
 'veins':('Veins','Blood vessels that carry blood toward the heart.'),
 'left ventricle':('Left ventricle','Heart chamber that pumps oxygen-rich blood into systemic circulation.'),
 'left atrium':('Left atrium','Heart chamber that receives oxygen-rich blood from the lungs.'),
 'esophagus':('Esophagus','Digestive tube that moves swallowed food toward the stomach.'),
 'small intestine':('Small intestine','Digestive organ where most nutrient absorption occurs.'),
 'liver':('Liver','Organ that produces bile and carries out many metabolic functions.'),
 'peristalsis':('Peristalsis','Waves of muscle contraction that move material along the digestive tract.'),
 'intestinal villi':('Villi','Small projections in the small intestine that increase absorption area.'),
 'xylem':('Xylem','Plant tissue that transports water and dissolved minerals.'),
 'phloem':('Phloem','Plant tissue that transports sugars from sources to sinks.'),
 'guard cells':('Guard cells','Cells that control opening and closing of a leaf stoma.'),
 'pollination in flowering plants':('Pollination','Transfer of pollen to a flower’s stigma.'),
 'ovary':('Ovary','Flower structure that contains ovules and may develop into a fruit.'),
 'seed':('Seed','Structure containing a plant embryo and stored resources.'),
 'fruit in botanical terms':('Fruit','Mature ovary of a flowering plant, sometimes with associated tissues.'),
 'root hairs benefit a plant':('Root hairs','Extensions that increase surface area for water and mineral uptake.'),
 'transpiration':('Transpiration','Loss of water vapor from plant surfaces, especially leaves.'),
 'vegetative reproduction':('Vegetative reproduction','Asexual production of new plants from stems, roots, or leaves.'),
 'biotechnology':('Biotechnology','Use of organisms or biological processes to make useful products.'),
 'plasmid':('Plasmid','Small DNA molecule separate from a bacterium’s main chromosome.'),
 'main purpose of pcr':('Polymerase chain reaction','Laboratory method used to make many copies of a selected DNA region.'),
 'dna fragments by size':('Gel electrophoresis','Method that separates DNA fragments by size using an electric field.'),
 'dna assembled from different sources':('Recombinant DNA','DNA molecule assembled from genetic material from different sources.'),
 'amino acids':('Amino acid','Molecule that links with others to form proteins.'),
 'carbohydrates':('Carbohydrate','Biological molecule group that includes starch and glycogen.'),
 'active site of an enzyme':('Active site','Region of an enzyme where a substrate binds and a reaction occurs.'),
 'enzyme cofactor':('Cofactor','Nonprotein helper required for some enzymes to function.'),
 'hydrolysis':('Hydrolysis','Reaction in which water helps break a chemical bond.'),
 'phospholipids':('Phospholipid','Molecule with a water-attracting head and water-repelling tails.'),
 'denaturation':('Denaturation','Loss of a protein’s functional shape due to altered conditions.'),
 'kelvin':('Kelvin','SI base unit for thermodynamic temperature.'),
 'boyle.s law':("Boyle’s law",'For a fixed amount of gas at constant temperature, pressure and volume vary inversely.'),
 'charles.s law':("Charles’s law",'For a fixed amount of gas at constant pressure, volume increases with kelvin temperature.'),
 'gas’s partial pressure':('Partial pressure','Pressure contributed by one gas in a mixture of gases.'),
 'alpha particle':('Alpha particle','Nuclear emission containing two protons and two neutrons.'),
 'gamma radiation':('Gamma radiation','High-energy electromagnetic radiation emitted during some nuclear changes.'),
 'radioactive half-life':('Half-life','Time required for half the unstable nuclei in a sample to decay.'),
 'nuclear fission':('Nuclear fission','Splitting of a large nucleus into smaller nuclei.'),
 'nuclear fusion':('Nuclear fusion','Joining of small nuclei to form a larger nucleus.'),
 'hydrocarbon':('Hydrocarbon','Organic compound containing only carbon and hydrogen.'),
 'alkene':('Alkene','Hydrocarbon containing a carbon–carbon double bond.'),
 'structural isomers':('Structural isomers','Compounds with the same molecular formula but different atom connections.'),
 'carboxylic acid':('Carboxylic acid','Organic compound containing a carboxyl functional group.'),
 'filtration':('Filtration','Method that separates solid particles from a fluid using a barrier.'),
 'distillation':('Distillation','Separation method based on differences in boiling points.'),
 'decanting':('Decanting','Separation method that pours liquid away from settled solids.'),
 'sieving':('Sieving','Separation method that sorts solid particles by size.'),
 'oxidizing agent':('Oxidizing agent','Reactant that accepts electrons and causes another reactant to be oxidized.'),
 'reducing agent':('Reducing agent','Reactant that donates electrons and causes another reactant to be reduced.'),
 'projectile’s range':('Projectile range','Horizontal distance traveled before a projectile returns to its launch height.'),
 'horizontal speed':('Horizontal velocity','Horizontal component of a projectile’s velocity.'),
 'angular displacement':('Angular displacement','Change in angular position.'),
 'angular velocity':('Angular velocity','Rate of change of angular position.'),
 'torque':('Torque','Turning effect of a force about an axis.'),
 'rotational inertia':('Rotational inertia','Measure of resistance to changes in rotational motion.'),
 'photovoltaic cell':('Photovoltaic cell','Device that converts light energy directly into electrical energy.'),
 'fuel cell':('Fuel cell','Device that converts chemical energy into electrical energy through a reaction.'),
 'photon':('Photon','Quantum, or discrete packet, of electromagnetic energy.'),
 'photoelectric effect':('Photoelectric effect','Emission of electrons from a material after light transfers sufficient energy.'),
 'discrete atomic energy level':('Energy level','Allowed energy state of an electron in an atom.'),
 'atomic emission spectrum':('Emission spectrum','Pattern of wavelengths emitted by excited atoms.'),
 'dimensional analysis':('Dimensional analysis','Use of units to check or derive relationships in calculations.'),
 '4.6 billion years':('Earth’s age','Approximate age of Earth based on radiometric dating.'),
 'accretion':('Accretion','Growth of a body as smaller particles collide and combine.'),
 'planetary differentiation':('Planetary differentiation','Separation of planetary material into layers with different properties.'),
 'cyanobacteria':('Cyanobacteria','Photosynthetic bacteria that contributed to oxygen in Earth’s early atmosphere.'),
 'cenozoic era':('Cenozoic Era','Geologic era following the Mesozoic and continuing to the present.'),
 'mesozoic era':('Mesozoic Era','Geologic era associated with the dominance of non-avian dinosaurs.'),
 'mass extinction':('Mass extinction','Geologically rapid loss of many species across the world.'),
 'one year':('Revolution','One complete orbit of Earth around the Sun.'),
 'main cause of earth’s seasons':('Axial tilt','Earth’s tilted axis changes the angle and duration of sunlight during its orbit.'),
 'mineral streak':('Streak','Color of a mineral’s powdered form.'),
 'hardness':('Hardness','Mineral property describing resistance to scratching.'),
 'luster':('Luster','Way light reflects from a mineral’s surface.'),
 'cleavage':('Cleavage','Tendency of a mineral to break along flat planes.'),
 'crust':('Crust','Thin, outermost solid layer of Earth.'),
 'mantle':('Mantle','Thick layer of hot rock between Earth’s crust and core.'),
 'asthenosphere':('Asthenosphere','Weak, slowly flowing region of the upper mantle beneath the lithosphere.'),
 'inner core':('Inner core','Solid, iron-rich central region of Earth.'),
 'p waves':('P waves','Fast seismic waves that travel through solids and liquids.'),
 's waves':('S waves','Seismic waves that travel through solids but not liquids.'),
 'aftershock':('Aftershock','Smaller earthquake that follows a larger event in the same region.'),
 'lahar':('Lahar','Fast-moving volcanic mudflow made of water and volcanic debris.'),
 'pyroclastic flow':('Pyroclastic flow','Fast, hot flow of gas and volcanic fragments down a volcano.'),
 'relative dating':('Relative dating','Method that determines whether rocks or events are older or younger.'),
 'troposphere':('Troposphere','Lowest atmospheric layer, where most weather occurs.'),
 'stratosphere':('Stratosphere','Atmospheric layer above the troposphere that contains the ozone layer.'),
 'pressure gradient':('Pressure gradient','Change in pressure over a distance.'),
 'ozone layer':('Ozone layer','Region of the stratosphere with elevated ozone that absorbs much ultraviolet radiation.'),
 'climate mitigation':('Climate mitigation','Actions that reduce greenhouse-gas emissions or increase their removal.'),
 'climate adaptation':('Climate adaptation','Actions that reduce harm from actual or expected climate effects.'),
 'tidal range':('Tidal range','Difference in height between high tide and low tide.'),
 'spring tides':('Spring tide','Tide with a large tidal range near new or full moon.'),
 'neap tides':('Neap tide','Tide with a small tidal range near first- or third-quarter moon.'),
 'upwelling':('Upwelling','Rise of deeper, nutrient-rich water toward the ocean surface.'),
 'permeability':('Permeability','Ability of a material to allow fluids to pass through connected spaces.'),
 'drainage divide':('Drainage divide','High land that separates neighboring watersheds.'),
 'hypothesis':('Hypothesis','Testable proposed explanation or prediction.'),
 'observation':('Observation','Information gathered with senses or scientific instruments.'),
 'inference':('Inference','Conclusion drawn from observations and evidence.'),
 'scientific theory':('Scientific theory','Broad explanation supported by substantial evidence.'),
 'scientific law':('Scientific law','Description of a consistently observed pattern in nature.'),
 'controlled variable':('Controlled variable','Condition kept the same when groups are compared.'),
 'confounding variable':('Confounding variable','Factor that changes alongside the tested factor and complicates interpretation.'),
 'random assignment':('Random assignment','Method that places participants into groups by chance.'),
 'random sampling':('Random sampling','Method that gives population members a chance of selection.'),
 'meter':('Meter','SI base unit of length.'),
 'kilogram':('Kilogram','SI base unit of mass.'),
 'second':('Second','SI base unit of time.'),
 'bar graph':('Bar graph','Graph used to compare values across categories.'),
 'median':('Median','Middle value in an ordered data set.'),
 'outlier':('Outlier','Data value unusually far from the rest of a set.'),
 'recycling':('Recycling','Processing used materials so they can become new products.'),
 'coal':('Coal','Nonrenewable fossil fuel formed from ancient plant material.'),
 'safety data sheet':('Safety Data Sheet','Document describing a chemical’s hazards and safe handling.'),
 'closed-toe shoes':('Closed-toe shoes','Footwear that helps protect feet from spills and dropped objects.'),
 'chemical waste':('Chemical waste','Material requiring disposal through designated laboratory procedures.'),
 'glassware inspection':('Glassware inspection','Check for cracks or damage before using laboratory glass.'),
 'emergency equipment':('Emergency equipment','Equipment such as an eyewash station or safety shower used during an emergency.'),
 'sampling bias':('Sampling bias','Systematic distortion caused by how a sample is selected.'),
 'stratified sampling':('Stratified sampling','Sampling method that selects members from each defined subgroup.'),
 'instrument resolution':('Resolution','Smallest change an instrument can distinguish.'),
 'systematic measurement error':('Systematic error','Consistent measurement bias in the same direction.'),
 'random measurement error':('Random error','Unpredictable variation among repeated measurements.'),
 'point source of pollution':('Point-source pollution','Pollution discharged from a single identifiable location.'),
 'nonpoint-source pollution':('Nonpoint-source pollution','Pollution entering from diffuse sources across an area.'),
 'bioaccumulation':('Bioaccumulation','Buildup of a substance in an organism over time.'),
 'biomagnification':('Biomagnification','Increase in contaminant concentration at higher trophic levels.'),
 'eutrophication':('Eutrophication','Nutrient enrichment that can lead to excessive algae and low oxygen.'),
 'design criterion':('Design criterion','Feature or level of performance a solution should achieve.'),
 'design constraint':('Design constraint','Limit such as cost, time, or materials that restricts a design.'),
 'prototype':('Prototype','Preliminary version built to test a design.'),
 'iteration in design':('Iteration','Repeated cycle of testing, evaluation, and design revision.'),
 'peer review':('Peer review','Evaluation of scholarly work by people with relevant expertise.'),
 'plagiarism':('Plagiarism','Presenting another person’s words or ideas without proper credit.'),
 'sample size':('Sample size','Number of individuals or observations included in a study.'),
 'transect':('Transect','Line or path along which observations are collected.'),
 'quadrat':('Quadrat','Frame used to sample organisms in a defined area.'),
 'uncertainty':('Measurement uncertainty','Estimated range of values that could reasonably include a measured quantity.'),
 'accuracy':('Accuracy','Closeness of a measured value to an accepted reference value.'),
 'precision':('Precision','Closeness of agreement among repeated measurements.'),
 'exposure':('Exposure','Presence of people or assets where a hazard could occur.'),
 'vulnerability':('Vulnerability','Susceptibility to harm when exposed to a hazard.'),
 'carbon monoxide':('Carbon monoxide','Colorless gas produced by incomplete combustion that interferes with oxygen transport.'),
 'ground-level ozone':('Ground-level ozone','Secondary pollutant formed when other pollutants react in sunlight.'),
 'source reduction':('Source reduction','Preventing waste before it is created.'),
 'composting':('Composting','Managed decomposition of suitable organic material.'),
 'age-structure diagram':('Age-structure diagram','Graph showing the distribution of a population among age groups.'),
 'riparian zone':('Riparian zone','Land area alongside a river or stream.'),
 'ecological succession':('Ecological succession','Change in community composition over time.'),
 'system input':('System input','Matter or energy entering a defined system.'),
 'system boundary':('System boundary','Defined edge used to identify what is inside or outside a system.'),
}

TERM_FIXES.update({
 'electrical to mechanical':('Electric motor','Device that converts electrical energy into mechanical energy.'),
 'mechanical to electrical':('Electric generator','Device that converts mechanical energy into electrical energy.'),
 'electromagnetic':('Electromagnetic wave','Wave of changing electric and magnetic fields that can travel through a vacuum.'),
 'opposition to electric current':('Electrical resistance','Property that opposes electric current in a material or component.'),
 'resistance':('Electrical resistance','Property that opposes electric current in a material or component.'),
 'electric force magnitude':('Coulomb’s law','Relationship describing how electric force depends on charge and separation.'),
 'increasing damping':('Damping','Process that reduces the amplitude of an oscillating system over time.'),
})

def norm(s):return re.sub(r'[^A-Z]','',s.upper())
def clean(s):return re.sub(r'\s+',' ',re.sub(r"^[\s:;,.-]+|[\s?!.;,]+$",'',s)).strip()
DISPLAY_FIXES={'PH':'pH','DNA':'DNA','RNA':'RNA','TRNA':'tRNA','NACL':'NaCl','CO2':'CO₂','H2O':'H₂O','ATP':'ATP','SI':'SI','PCR':'PCR','FMA':'F = ma','GJ':'GJ'}
def display_term(s):
    key=norm(s)
    if key in DISPLAY_FIXES:return DISPLAY_FIXES[key]
    return ' '.join(w[:1].upper()+w[1:] for w in s.split())
def viable(s):
    n=norm(s)
    return bool(n) and n not in GENERIC and (len(n)>=3 or s.lower() in {'ph'}) and len(n)<=32 and len(s.split())<=4 and not BAD_START.match(s.strip()) and not BAD_ANSWER.match(s.strip()) and not BAD_TERM.search(s) and not re.search(r'[,;:]|\b(?:and|or|but|not|it|they|their|its)\b',s,re.I) and not re.search(r'\b(?:to|for|with|by|from|than|as|at|into|onto|of)$',s,re.I)

def answer_term(answer):
    s=clean(answer)
    s=re.sub(r'^(?:a|an|the)\s+','',s,flags=re.I)
    s=re.sub(r'^(?:in|on|at|from|into|through|by)\s+','',s,flags=re.I)
    s=re.sub(r'\s+under specified conditions$','',s,flags=re.I)
    fixed=TERM_FIXES.get(s.lower())
    if fixed:return fixed[0]
    if not viable(s) or BAD_ANSWER.match(s) or re.fullmatch(r'[-+]?\d+(?:\.\d+)?(?:\s*[a-zA-Z/°]+)?',s):return None
    # Crossword entries should name a concept, not restate an answer sentence.
    if re.search(r'\b(?:is|are|was|were|has|have|had|can|could|would|should|will|helps?|allows?|causes?|means?|describes?|occurs?|increases?|decreases?|provides?|contains?|includes?|forms?|produces?|makes?|uses?|surrounds?|located|divided|found|called|known|made|used|stored|released|measured|carried|connected|responsible|required|needed|able|limits?|leaves?|shrinks?|moves?|moved|fits?|indicates?|results?|supports?|transfers?|reduces?|promotes?|enters?|exits?|maintains?|regulates?|changes?|affects?|involves?|depends?|requires?|allows?|prevents?|represents?|describes?|explains?|shows?|forms?|becomes?)\b',s,re.I):return None
    if re.search(r'\b(?:associated with|divided by|multiplied by|caused by|made of|located in|located at|consisting of|depending on|relative to|as a whole)\b',s,re.I):return None
    if s.lower().startswith(('number of ','amount of ','ability to ','rate at which ','way that ','result of ','condition in which ','process by which ')):return None
    if re.search(r'\b(?:be|being|become|became|because|expected|plausible|likely|reasonable|conclusion|explanation|what|which|how|when|where|assume|follows|suggests|indicates)\b',s,re.I):return None
    return s

def question_term(q):
    s=clean(q).rsplit('. ',1)[-1]
    pats=[r'^What (?:is|are)\s+(?:a|an|the)\s+(.+)$',r'^What (?:is|are)\s+(.+)$',r'^What does\s+(.+?)\s+(?:mean|describe|represent|count|compare|measure|estimate|indicate|identify|determine|show|study|do)\b.*$',r'^What can\s+(.+?)\s+(?:indicate|show|reveal|tell|measure|estimate)\b.*$',r'^How does\s+(.+?)\s+(?:work|function|differ|affect|change|help|contribute|form|occur|produce|interact|respond|relate|cause|compare|increase|decrease)\b.*$',r'^How do\s+(.+?)\s+(?:differ|interact|work|respond|relate|compare)\b.*$',r'^Where (?:is|are)\s+(.+?)\s+(?:located|found)\b.*$',r'^What level of organization is\s+(.+)$']
    cut=r'\b(?:important|useful|different|necessary|possible|most directly involved|the best|the correct|often|usually|typically|when|because|since|if|as|that|which|and|but|while|need|has|have|do|does|can|could|will|would|should|is|are|was|were|be|being|been|provides|helps|occurs|work|works|function|functions|become|became|allow|allows|regulate|regulates|change|changes|carry|carries|surround|surrounds|uses|use|make|makes|affect|affects|happen|happens|form|forms|produce|produces|interact|interacts|remain|remains|compare|compares|count|counts|describe|describes|identify|identifies|measure|measures|estimate|estimates|indicate|indicates|show|shows|reveal|reveals|tell|tells|used to|helping|help|helps|located|found|study|studies)\b.*$'
    for pat in pats:
        m=re.match(pat,s,re.I)
        if not m:continue
        x=clean(m.group(1));x=re.sub(r'^(?:a|an|the)\s+','',x,flags=re.I);x=re.sub(cut,'',x,flags=re.I).strip()
        # Remove trailing context clauses that do not belong to the scientific term.
        x=re.sub(r'\s+(?:in|within|of|for)\s+(?:water|a water study|the cell|a cell|an atom|the atom|a solution|the body|the environment|an organism|a population|a community|an ecosystem|a system|this process|this reaction|a reaction|the reaction)$','',x,flags=re.I)
        fixed=TERM_FIXES.get(x.lower())
        if fixed:return fixed[0]
        if viable(x):return x[0].upper()+x[1:]
    return None

TERM_RULES=[
 (r'loss of electrons','Oxidation'),(r'gain of electrons','Reduction'),(r'change in velocity per unit time','Acceleration'),
 (r'force divided by area','Pressure'),(r'mass multiplied by velocity','Momentum'),(r'rate of energy transfer','Power'),
 (r'distance between corresponding points','Wavelength'),(r'maximum displacement from equilibrium','Amplitude'),
 (r'net movement of particles from higher to lower concentration','Diffusion'),(r'net movement of water across','Osmosis'),
 (r'spontaneous change of an unstable nucleus','Radioactive Decay'),(r'solid changing to liquid','Melting'),
 (r'gas changing to liquid','Condensation'),(r'forward and reverse reaction rates are equal','Dynamic Equilibrium'),
 (r'maximum amount that can dissolve','Solubility'),(r'amount of substance','Mole'),(r'energy transferred because of a temperature difference','Heat'),
 (r'energy associated with motion','Kinetic Energy'),(r'energy associated with position','Potential Energy'),
 (r'number of atoms of each element','Atom Count'),(r'surface area for exchange','Surface Area'),
 (r'maintain internal conditions','Homeostasis'),(r'lacks a membrane.bound nucleus','Prokaryote'),
 (r'cells arise from existing cells','Cell Theory'),(r'specialized for different functions','Cell Specialization'),
 (r'exchange relative to cell volume','Surface Area-to-Volume Ratio'),
 (r'protons and neutrons','Nucleus'),(r'four','Valence'),
 (r'angle of incidence equals the angle of reflection','Reflection'),
 (r'the upper surface of the saturated groundwater zone','Water Table'),
 (r'a natural process capable of causing harm','Hazard'),
 (r'number of protons and neutrons','Mass Number'),(r'same number of protons.*different number of neutrons','Isotope'),
 (r'positive and negative charges balance','Electrical Neutrality'),(r'more protons than electrons','Positive Ion'),
 (r'the number of atoms of each element is conserved','Conservation of Mass'),(r'atoms of each element on both sides','Balanced Equation'),
 (r'particles are constantly moving','Particle Motion'),(r'particles remain close together','Liquid'),
 (r'molecules spread apart','Gas'),(r'particles vibrate in fixed positions','Solid'),
 (r'the process of changing a liquid to a gas','Vaporization'),(r'liquid changing to gas','Vaporization'),
 (r'the number of protons in an atom','Atomic Number'),(r'weighted average of isotope masses','Atomic Mass'),
 (r'a charged atom or group of atoms','Ion'),(r'loss of electrons','Oxidation'),(r'gain of electrons','Reduction'),
 (r'a substance that speeds a reaction','Catalyst'),(r'lowers activation energy','Catalyst'),
 (r'forward and reverse rates are equal','Dynamic Equilibrium'),
 (r'one that can proceed in both directions','Reversible Reaction'),
 (r'resistance to changes in motion','Inertia'),(r'vector sum of all forces','Net Force'),
 (r'change in momentum caused by a force over time','Impulse'),
 (r'the rate of change of angular position','Angular Velocity'),(r'turning effect of a force about an axis','Torque'),
 (r'resistance to changes in rotational motion','Rotational Inertia'),
 (r'electromagnetic radiation','Electromagnetic Wave'),(r'electric potential difference','Voltage'),
 (r'rate of electric charge flow','Current'),(r'opposition to electric current','Resistance'),
 (r'a change in propagation direction.*wave speed','Refraction'),
 (r'a gravitationally bound system of stars','Galaxy'),(r'group of galaxies bound by gravity','Galaxy Cluster'),
 (r'water within connected pores.*below the water table','Groundwater'),
 (r'replenishment of groundwater','Recharge'),(r'cloudiness caused by suspended particles','Turbidity'),
 (r'oxygen gas present in the water','Dissolved Oxygen'),(r'loss or gain of an electron','Redox'),
 (r'cells arise from existing cells','Cell Theory'),(r'making RNA from a DNA template','Transcription'),
 (r'assembling a protein from an RNA message','Translation'),(r'joining amino acids','Protein Synthesis'),
 (r'different forms of the same gene','Allele'),(r'organism.s genetic makeup','Genotype'),
 (r'observable traits of an organism','Phenotype'),(r'differential reproductive success','Natural Selection'),
 (r'organism that carries a pathogen between hosts','Vector'),
 (r'molecular feature recognized by immune receptors','Antigen'),
 (r'noncellular agent that reproduces using host machinery','Virus'),
 (r'organism that makes organic food from nonliving sources','Producer'),
 (r'organism community and its physical environment','Ecosystem'),
 (r'the number of species present','Species Richness'),(r'a species native to a limited geographic area','Endemic Species'),
 (r'first change in rotational position measured as an angle','Angular Displacement'),
 (r'average particle kinetic energy','Temperature'),
 (r'upward force exerted by a fluid','Buoyant Force'),
 (r'fraction of incoming radiation a surface reflects','Albedo'),
 (r'a preserved evidence of an organism.s activity','Trace Fossil'),
 (r'a surface representing missing geologic time','Unconformity'),
 (r'past each other','Transform Boundary'),(r'a former supercontinent','Pangaea'),
 (r'place where rupture begins inside earth','Focus'),(r'surface point directly above its focus','Epicenter'),
 (r'long-term patterns and averages of atmospheric conditions','Climate'),
 (r'atmospheric gases absorb and emit infrared radiation','Greenhouse Effect'),
 (r'energy from earth.s internal heat','Geothermal Energy'),
 (r'preventing waste before it is created','Source Reduction'),
 (r'using an item again without first processing','Reuse'),
 (r'managed biological decomposition of organic material','Composting'),
 (r'pollutant formed through reactions in the atmosphere','Secondary Pollutant'),
 (r'pollutant emitted directly from a source','Primary Pollutant'),
 (r'factor deliberately changed by the investigator','Independent Variable'),
 (r'outcome measured in response to a change','Dependent Variable'),
 (r'condition kept constant across comparison groups','Controlled Variable'),
 (r'ability of others to repeat a study','Reproducibility'),
 (r'uncertainty describes measurement limitations','Measurement Uncertainty'),
 (r'unpredictable variation among repeated measurements','Random Error'),
 (r'error that shifts results consistently','Systematic Error'),
 (r'smallest change the instrument can distinguish','Resolution'),
 (r'a comparison that helps define recovery goals','Reference Ecosystem'),
 (r'feature or level of performance a solution should achieve','Criterion'),
 (r'limit such as cost, time, materials','Constraint'),
 (r'preliminary version built to test a design','Prototype'),
 (r'repeating a test and revision cycle','Iteration'),
]
TERM_RULES += [
 (r'weighted average of isotope masses','Average Atomic Mass'),(r'electron locations are described by regions of probability','Electron Cloud'),
 (r'electron count changes while its element identity stays the same','Ion Formation'),(r'the number of atoms of each element is conserved','Conservation of Mass'),
 (r'the sum of kinetic and potential energy','Mechanical Energy'),(r'energy is transferred or transformed, not created or destroyed','Conservation of Energy'),
 (r'force does positive work.*direction of displacement','Work'),(r'mechanical energy is converted into other forms','Thermal Energy'),
 (r'they can take different amounts of time','Power'),(r'useful output energy with total input energy','Efficiency'),
 (r'chemical splash goggles specified by the teacher','Splash Goggles'),(r'secure it away from equipment','Long Hair Safety'),
 (r'designated disposal procedures','Chemical Waste'),(r'become contaminated or lead to accidental exposure','Contamination'),
 (r'may contaminate the shared supply','Chemical Contamination'),(r'cracks or damage can make it unsafe','Glassware Inspection'),
 (r'follow trained emergency procedures','Emergency Equipment'),(r'unreviewed changes can introduce unknown risks','Authorized Procedure'),
 (r'avoid using it and notify the teacher','Unlabeled Chemical'),(r'report it and use teacher.approved replacement','Damaged Glassware'),
 (r'alert the teacher and follow the designated response','Spill Response'),(r'follow instructed glove.removal and handwashing procedures','Handwashing'),
 (r'information gathered using senses or instruments','Observation'),(r'evidence could support or challenge it','Hypothesis'),
 (r'explanation or conclusion drawn from observations','Inference'),(r'broad explanation supported by substantial evidence','Scientific Theory'),
 (r'representation using mathematical relationships','Mathematical Model'),(r'representation of how components and processes relate','System Model'),
 (r'sampling organisms within a defined area','Quadrat Sampling'),(r'a line or path along which observations are collected','Transect'),
 (r'bias from choosing sites based on preference','Sampling Bias'),(r'a connection between evidence and claim using scientific principles','Reasoning'),
 (r'a statement proposed as an answer or explanation','Claim'),(r'a preliminary version built to test a design','Prototype'),
 (r'a limit such as cost, time, materials','Constraint'),(r'a feature or level of performance a solution should achieve','Criterion'),
 (r'repeating a test.and.revision cycle','Iteration'),(r'one replenished naturally fast enough for continued use','Renewable Resource'),
 (r'preventing waste before it is created','Source Reduction'),(r'using an item again without processing it into raw material','Reuse'),
 (r'managed biological decomposition of suitable organic material','Composting'),
 (r'difference in conditions near a habitat boundary','Edge Effect'),(r'connection that can allow organisms to move between habitat patches','Wildlife Corridor'),
 (r'assisting recovery of a degraded ecosystem','Ecological Restoration'),
 (r'substance or energy input capable of environmental harm','Pollutant'),(r'specific identifiable discharge location','Point Source'),
 (r'pollution arising from diffuse sources','Nonpoint Source'),(r'buildup of a substance in an organism over time','Bioaccumulation'),
 (r'presence of people or assets where a hazard may occur','Exposure'),(r'susceptibility to harm when exposed','Vulnerability'),
 (r'large volume of water displaced suddenly','Tsunami'),
 (r'resistance to scratching','Hardness'),(r'color of its powder','Streak'),(r'surface reflects light','Luster'),
 (r'ordered crystal structure','Crystal Structure'),(r'location where rupture begins','Focus'),(r'surface point directly above its focus','Epicenter'),
 (r'transfer of pollen to a stigma','Pollination'),(r'energy stored in organic molecules','Chemical Energy'),
 (r'light energy.*chemical energy','Photosynthesis'),(r'making RNA from a DNA template','Transcription'),
 (r'assembling a protein from an RNA message','Translation'),(r'dna sequence contributing to a functional product','Gene'),
 (r'a version of a gene','Allele'),(r'replicated copies of a chromosome joined','Sister Chromatids'),
 (r'division of the cytoplasm','Cytokinesis'),(r'a small DNA molecule separate from a bacterium','Plasmid'),
 (r'cell specialized for transmitting information','Neuron'),(r'chemical signal used at many synapses','Neurotransmitter'),
 (r'communication junction between a neuron and another cell','Synapse'),
 (r'small lung air sacs involved in gas exchange','Alveoli'),(r'break down food and absorb nutrients','Digestion'),
 (r'a compound containing only carbon and hydrogen','Hydrocarbon'),(r'an alkene has a carbon.carbon double bond','Alkene'),
 (r'mixture uniform at the particle level','Solution'),(r'maximum amount that can dissolve','Solubility'),
 (r'substances present before.*consumed in a reaction','Reactants'),(r'substances formed by a chemical reaction','Products'),
 (r'relative number of particles or moles represented','Coefficient'),
 (r'energy changes accompanying chemical processes','Thermochemistry'),(r'a process that releases heat','Exothermic'),
 (r'a process that absorbs heat','Endothermic'),(r'energy barrier for a reaction pathway','Activation Energy'),
 (r'substance that reduces a reaction.s rate','Inhibitor'),
 (r'attraction between electric charges','Electrostatic Attraction'),(r'sharing of electron pairs between atoms','Covalent Bond'),
 (r'transfer of electrons between atoms','Ionic Bond'),(r'a mixture separated by interactions with mobile and stationary phases','Chromatography'),
 (r'pouring off a liquid from settled solid','Decanting'),(r'pressure and volume','Boyle.s Law'),
 (r'volume and kelvin temperature','Charles.s Law'),(r'mass per mole of a substance','Molar Mass'),
 (r'rate of change of angular position','Angular Velocity'),(r'turning effect of a force about an axis','Torque'),
 (r'combination of overlapping wave displacements','Interference'),
 (r'overlapping displacements reinforce','Constructive Interference'),(r'opposite displacements partly or completely cancel','Destructive Interference'),
 (r'a point with zero displacement amplitude','Node'),(r'the number of cycles per unit time','Frequency'),
 (r'the distance between corresponding points on adjacent cycles','Wavelength'),
 (r'fraction of incoming radiation a surface reflects','Albedo'),
 (r'atmospheric gases absorb and emit infrared radiation','Greenhouse Effect'),
 (r'energy from earth.s internal heat','Geothermal Energy'),(r'the upper surface of the saturated groundwater zone','Water Table'),
 (r'a geologic unit that stores and transmits usable amounts of groundwater','Aquifer'),
 (r'water within connected pores and fractures below the water table','Groundwater'),
 (r'replenishment of groundwater','Recharge'),(r'cloudiness caused by suspended particles','Turbidity'),
 (r'oxygen gas present in the water and available','Dissolved Oxygen'),
 (r'suspended solid particles and liquid droplets','Particulate Matter'),
 (r'a pollutant emitted directly from a source','Primary Pollutant'),
 (r'a pollutant formed through reactions in the atmosphere','Secondary Pollutant'),
 (r'a surface representing missing geologic time','Unconformity'),(r'past each other','Transform Boundary'),
 (r'a former supercontinent','Pangaea'),(r'magma that reaches earth.s surface','Lava'),
 (r'molten or partly molten rock below the surface','Magma'),
 (r'small fragments of volcanic rock, minerals, and glass','Tephra'),
 (r'liquid water changes to vapor','Evaporation'),(r'water vapor changes to liquid droplets','Condensation'),
 (r'water released from plant leaves','Transpiration'),(r'long.term patterns and averages of atmospheric conditions','Climate'),
 (r'change in velocity per unit time','Acceleration'),(r'force divided by area','Pressure'),
 (r'mass multiplied by velocity','Momentum'),(r'rate of energy transfer or work','Power'),
 (r'energy associated with motion','Kinetic Energy'),(r'energy associated with position','Potential Energy'),
 (r'net movement of particles from higher to lower concentration','Diffusion'),
 (r'net movement of water across a selectively permeable membrane','Osmosis'),
 (r'organism community and its physical environment','Ecosystem'),
 (r'organism that makes organic food from nonliving sources','Producer'),
 (r'the number of species present','Species Richness'),(r'a species native to a limited geographic area','Endemic Species'),
 (r'one species.*members in a defined area','Population'),(r'movement into a population','Immigration'),
 (r'movement out of a population','Emigration'),(r'individuals per unit area or volume','Population Density'),
 (r'differential reproductive success associated with heritable traits','Natural Selection'),
 (r'genetic makeup','Genotype'),(r'observable traits of an organism','Phenotype'),
]
def answer_concept(answer):
    for pat,term in TERM_RULES:
        if re.search(pat,answer,re.I):return term
    return None

def question_clue(q):
    s=clean(q).rstrip('?')
    transforms=[
      (r'^Which (structure|organelle|process|particle|subatomic particle|property|law|type|form|layer|rock|wave|variable|unit|instrument|organism|molecule|force|energy source|measurement|tool|feature|event|system|body system|cell|group|boundary|change|reaction|bond|pattern|method|evidence|model|resource|condition|factor|material|quantity|term|gas|star|planet|object|signal|component|device|sample|graph|organ|tissue|solution|mixture|compound|element|atom|ion|species|structure|mechanism|movement|interaction|transfer|cycle|zone|region|surface|line|point|scale|trend|effect|cause|result|response|adaptation|relationship|representation|practice|action|precaution|procedure|equipment|hazard|standard|datum|data|claim|conclusion)\s+(.*)$',r'\1 that \2'),
      (r'^What is (.+)$',r'Definition of \1'),
      (r'^What does (.+?) measure\b(.*)$',r'Measure of \1\2'),
      (r'^What does (.+?) mean\b(.*)$',r'Meaning of \1\2'),
      (r'^Where are (.+?) located\b(.*)$',r'Location of \1\2'),
      (r'^Where is (.+?) located\b(.*)$',r'Location of \1\2'),
      (r'^What happens when (.*)$',r'Change that occurs when \1'),
      (r'^Why does (.*)$',r'Reason \1'),
      (r'^Why is (.*)$',r'Reason \1'),
      (r'^How does (.*)$',r'Process by which \1'),
      (r'^How do (.*)$',r'Process by which \1'),
      (r'^Which (.*)$',r'\1'),
      (r'^What (.*)$',r'\1'),
      (r'^Where (.*)$',r'Location where \1'),
      (r'^How (.*)$',r'Way in which \1'),
    ]
    for p,r in transforms:
      if re.match(p,s,re.I):s=re.sub(p,r,s,flags=re.I);break
    s=re.sub(r'\bthe concept\b','',s,flags=re.I)
    s=re.sub(r'\s+',' ',s).strip(' .?')
    s=s[:1].upper()+s[1:]
    # An awkward fragment is worse than a clear source definition.
    if s.lower().startswith(('is most','are most','does the','do the','would the','can the','is the','are the','does a','do a')):return ''
    return s

def definition_clue(a,answer):
    s=clean(a)
    s=re.sub(r'^(?:It|They|This|These|Those)\s+','',s,flags=re.I)
    s=re.sub(r'^(?:To)\s+','Action of ',s,flags=re.I)
    s=s[:1].upper()+s[1:]
    # Remove the answer itself when source wording repeats it, avoiding a giveaway.
    if answer:s=re.sub(re.escape(answer), 'the concept', s, flags=re.I)
    s=re.sub(r'\bthe concept\b','process',s,flags=re.I)
    s=re.sub(r'\b(?:is|are) process\b','is a process',s,flags=re.I)
    return s

def topic_group(tid):
    """Closely related Science units that can share core vocabulary."""
    if tid=='scientific-method':return 'inquiry'
    if tid.startswith('science--life-science-biology--'):
        tail=tid.rsplit('--',1)[-1]
        if any(x in tail for x in ('human-body','nervous-and-endocrine','circulation-and-respiration','digestion-and-nutrition','immunity-and-disease')):return 'biology-body'
        if any(x in tail for x in ('ecology','population','biodiversity','microorganisms')):return 'biology-ecology'
        if any(x in tail for x in ('genetics','evolution','classification')):return 'biology-evolution'
        return 'biology-cell'
    if tid.startswith('science--physical-science-chemistry--'):return 'chemistry'
    if tid.startswith('science--physics--'):
        tail=tid.rsplit('--',1)[-1]
        if any(x in tail for x in ('wave','sound','light-and-optics')):return 'physics-waves'
        if any(x in tail for x in ('electric','magnetism','static')):return 'physics-electricity'
        if any(x in tail for x in ('heat','thermal')):return 'physics-thermal'
        return 'physics-mechanics'
    if tid.startswith('science--earth-space-science--'):
        tail=tid.rsplit('--',1)[-1]
        if any(x in tail for x in ('earth-moon','solar-system')):return 'earth-solar-system'
        if any(x in tail for x in ('stars','galaxies','space-observation')):return 'earth-universe'
        if any(x in tail for x in ('weather','atmosphere','climate')):return 'earth-weather'
        if any(x in tail for x in ('ocean','groundwater','weather-and-the-water')):return 'environment-water'
        return 'earth-geology'
    if tid.startswith('science--inquiry-environment--'):
        tail=tid.rsplit('--',1)[-1]
        if any(x in tail for x in ('water-quality','air-quality','pollution')):return 'environment-pollution'
        if any(x in tail for x in ('groundwater','weather-and-the-water','ocean-currents')):return 'environment-water'
        if any(x in tail for x in ('environmental-resources','waste','renewable','population-and-resource','habitat','environmental-systems')):return 'environment-sustainability'
        return 'inquiry'
    return 'science'

def peer_eligible(target,peer):
    """Avoid borrowing from a merely adjacent unit when its vocabulary is out of scope."""
    ta=target.rsplit('--',1)[-1];pa=peer.rsplit('--',1)[-1]
    if target.startswith('science--inquiry-environment--'):
        if ta=='water-quality':
            return peer==target or pa in {'environmental-pollution','groundwater-and-watersheds','weather-and-the-water-cycle','ocean-currents-and-tides'}
        if ta=='air-quality':
            return peer==target or pa in {'environmental-pollution','atmosphere-and-air-pressure','climate-and-climate-change'}
        if ta=='environmental-pollution':
            return peer==target or pa in {'air-quality','water-quality','waste-and-recycling','environmental-systems-and-feedbacks'}
    if target.startswith('science--earth-space-science--'):
        if ta=='ocean-currents-and-tides':
            return peer==target or pa in {'earth-moon-and-sun','weather-and-the-water-cycle','groundwater-and-watersheds'}
        if ta=='groundwater-and-watersheds':
            return peer==target or pa in {'weather-and-the-water-cycle','ocean-currents-and-tides'}
        if ta=='earth-moon-and-sun':
            return peer==target or pa in {'solar-system','ocean-currents-and-tides'}
        if ta=='solar-system':
            return peer==target or pa in {'earth-moon-and-sun','stars-and-stellar-life-cycles','space-observation-and-exploration'}
    return True

def peer_term_eligible(target,peer,term,is_exact):
    """Term-level guardrails for neighboring topics with only partial overlap."""
    ta=target.rsplit('--',1)[-1];pa=peer.rsplit('--',1)[-1];key=norm(term)
    if ta in {'water-quality','air-quality'}:
        air={'PARTICULATEMATTER','PRIMARYPOLLUTANT','SECONDARYPOLLUTANT','CARBONMONOXIDE','GROUNDLEVELOZONE','TEMPERATUREINVERSION'}
        water={'DISSOLVEDOXYGEN','TURBIDITY','CONDUCTIVITY','FECALINDICATOR','BIOCHEMICALOXYGENDEMAND','BASELINE','EUTROPHICATION','THERMALPOLLUTION','AQUIFER','WATERTABLE','GROUNDWATER','GROUNDWATERRECHARGE'}
        if (ta=='water-quality' and key in air) or (ta=='air-quality' and key in water):return False
    if ta in {'stars-and-stellar-life-cycles','galaxies-and-the-universe','space-observation-and-exploration'} and pa in {'stars-and-stellar-life-cycles','galaxies-and-the-universe','space-observation-and-exploration'}:
        return is_exact
    if ta in {'genetics-and-inheritance','evolution-and-natural-selection','classification-and-taxonomy'} and pa in {'genetics-and-inheritance','evolution-and-natural-selection','classification-and-taxonomy'}:
        return is_exact
    if ta in {'waves-and-sound','light-and-optics','wave-interference-and-resonance'} and pa in {'waves-and-sound','light-and-optics','wave-interference-and-resonance'}:
        return is_exact
    if ta in {'electric-circuits','magnetism-and-electromagnetism','static-electricity','electric-power-and-safety'} and pa in {'electric-circuits','magnetism-and-electromagnetism','static-electricity','electric-power-and-safety'}:
        return is_exact
    return True

def clue_is_usable(term,clue):
    clue=clean(clue)
    if not clue or len(clue)<20 or len(clue)>180 or '?' in clue:return False
    if re.match(r'^(?:is|are|was|were|do|does|did|can|could|would|should|will|why|how|what|which|where|when|it|they|their|its|the concept|more the concept)\b',clue,re.I):return False
    if re.search(r'\b(?:what|which|why|how|where|when)\s+(?:is|are|does|do|did|can|could|would|should|will|was|were|level|term|process|kind|type|happens|causes?|caused)\b',clue,re.I):return False
    if re.match(r'^(?:more|less|higher|lower|faster|slower|greater|smaller|larger|most|least)\b',clue,re.I):return False
    if re.match(r'^(?:a|an)\s+(?:microscope|student|diagram|graph|sample|object|organism|cell|experiment|scenario|researcher|scientist)\b',clue,re.I):return False
    if re.search(r'\bthe process\s+(?:are|is|do|does|can|will)\b|\b(?:answer|outcome|conclusion)\s+(?:is|are|can|will)\s*$',clue,re.I):return False
    if norm(term) in norm(clue):return False
    if re.search(r'\b(?:answer|correct option|in this question|the question|the concept)\b',clue,re.I):return False
    return True

def load_banks():
    sets=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {QUESTION_SETS} from './public/review-lab/catalog.js'; console.log(JSON.stringify(QUESTION_SETS.filter(x=>x.subject==='Science')));"],cwd=ROOT,text=True))
    banks={}
    for t in sets:
        if t.get('file'):
            src=ROOT/'question-bank'/t['file'];data=json.loads(src.read_text());qs=[]
            for q in data['questions']:
                opts=q['choices'];ans=opts[q['correctAnswer']]
                qs.append({'question':q['question'],'answer':ans,'explanation':q.get('explanation','')})
        else:
            src=ROOT/'public/review-lab/question-sets/scientific-method.js';text=src.read_text()
            tuples=re.findall(r"\['[^']*','((?:[^'\\]|\\.)*)',\[(.*?)\],(\d+),'((?:[^'\\]|\\.)*)'\]",text)
            qs=[]
            for q,choices,i,ex in tuples:
                opts=re.findall(r"'((?:[^'\\]|\\.)*)'",choices)
                qs.append({'question':q,'answer':opts[int(i)],'explanation':ex})
        banks[t['id']]={'topic':t,'source':src,'questions':qs}
    return banks

def manual_scientific_method():
    return [
('Observation','Information gathered directly with senses or scientific instruments.'),('Question','Focused inquiry that can guide a testable investigation.'),('Hypothesis','Testable proposed explanation or prediction.'),('Independent Variable','Factor deliberately changed by the investigator.'),('Dependent Variable','Outcome measured in response to a change.'),('Control Group','Comparison group that does not receive the tested treatment.'),('Constant','Condition kept the same across comparison groups.'),('Trial','One repetition of an experimental procedure.'),('Data','Recorded observations and measurements from an investigation.'),('Quantitative','Describes data expressed as numbers or measurements.'),('Qualitative','Describes observations about qualities rather than numerical amounts.'),('Procedure','Ordered steps used to carry out an investigation.'),('Sample Size','Number of subjects or observations included in a study.'),('Replication','Repeating an investigation to check whether results are consistent.'),('Measurement Error','Difference between a measured value and the quantity’s true value.'),('Outlier','Result unusually far from the rest of a data set.'),('Correlation','Relationship in which variables change together; alone it does not prove cause.'),('Causation','Relationship in which a change in one factor produces a change in another.'),('Controlled Experiment','Test that changes one factor while holding other relevant conditions steady.'),('Reproducibility','Ability of other investigators to repeat a study using its reported methods.')]

MANUAL_TOPIC_TERMS={
 'science--physics--heat-and-thermal-energy':[
  ('Heat','Energy transferred between objects because of a temperature difference.'),('Temperature','Measure related to the average kinetic energy of particles.'),('Conduction','Heat transfer through interactions between particles in contacting materials.'),('Convection','Heat transfer by the bulk movement of a fluid.'),('Thermal radiation','Energy transfer by electromagnetic waves; no material medium is required.'),('Thermal equilibrium','Condition in which objects have equal temperature and there is no net heat transfer.'),('Insulation','Material or design that reduces the rate of heat transfer.'),('Buoyant force','Upward force a fluid exerts on an object within it.'),('Specific heat','Energy needed per unit mass to raise a substance one degree.'),('Phase change','Physical change from one state of matter to another.'),('Thermal energy','Energy associated with the motion and interactions of particles in a substance.'),('Energy transfer','Movement of energy from one object or region to another.'),('Thermal conductivity','Measure of how readily a material transfers thermal energy.'),('Latent heat','Energy transferred during a phase change without changing temperature.'),('Heat capacity','Energy required to raise the temperature of an entire object by one degree.'),('Temperature gradient','Change in temperature across a distance that can drive heat transfer.')],
 'science--earth-space-science--solar-system':[
  ('Star','Large, luminous sphere of plasma powered by processes in its interior.'),('Jupiter','Largest planet in the solar system.'),('Gravity','Attractive interaction that governs the motion of planets and other massive objects.'),('Asteroid belt','Region of many small rocky bodies located mainly between Mars and Jupiter.'),('Rotation','Spin of an object around its axis.'),('Revolution','Orbital motion of one object around another.'),('Comet','Small solar-system body containing ice, dust, and rock that can form a tail near the Sun.'),('Nuclear fusion','Process in which light atomic nuclei combine and release energy in stars.'),('Orbit','Path of an object as it moves around another object under gravity.'),('Natural satellite','Naturally occurring object that orbits a planet or other larger body.'),('Astronomical unit','Distance unit based approximately on the average distance between Earth and the Sun.'),('Orbital period','Time an orbiting object takes to complete one orbit.')],
 'science--earth-space-science--earth-moon-and-sun':[
  ('Earth rotation','Earth’s spin around its axis, producing the daily cycle of day and night.'),('Axial tilt','Angle between a planet’s rotation axis and a line perpendicular to its orbital plane.'),('Solar eclipse','Event in which the Moon passes between Earth and the Sun and blocks some sunlight.'),('Lunar eclipse','Event in which Earth’s shadow falls on the Moon.'),('Lunar phase','Apparent shape of the Moon’s sunlit portion as viewed from Earth.'),('Full moon','Lunar phase when the Moon’s near side appears fully illuminated from Earth.'),('New moon','Lunar phase when the Moon is near the direction of the Sun in the sky.'),('Orbital plane','Plane containing the path of an orbiting object.'),('Synchronous rotation','Rotation in which an object’s spin period matches its orbital period.'),('Spring tide','Tide with a large tidal range near new or full moon, when solar and lunar effects align.'),('Neap tide','Tide with a small tidal range near first- or third-quarter moon.'),('Tidal force','Difference in gravitational pull across an extended object, contributing to ocean tides.')],
 'science--earth-space-science--ocean-currents-and-tides':[
  ('Coriolis effect','Apparent deflection of moving air or water due to Earth’s rotation.'),('Salinity','Measure of the amount of dissolved salts in water.'),('Thermohaline circulation','Large-scale ocean circulation driven by water-density differences related to temperature and salinity.'),('Upwelling','Rise of deeper ocean water toward the surface, often bringing nutrients.'),('Tidal range','Vertical difference between high tide and low tide.'),('Surface current','Ocean flow mainly in the upper layer, often driven by winds.'),('Deep current','Ocean flow below the surface associated with density differences.')],
 'science--earth-space-science--groundwater-and-watersheds':[
  ('Permeability','Ability of connected spaces in a material to transmit fluid.'),('Porosity','Fraction of a material’s volume made up of open spaces.'),('Watershed','Area of land that drains water to a common outlet.'),('Drainage divide','Higher land that separates neighboring drainage basins.'),('Infiltration','Movement of water from the ground surface into soil or rock.'),('Runoff','Water that flows over land toward streams or other drainage.'),('Base flow','Streamflow supplied mainly by groundwater between precipitation events.'),('Groundwater discharge','Movement of groundwater into streams, springs, or other surface waters.')],
 'science--life-science-biology--genetics-and-inheritance':[
  ('Recessive allele','Allele whose associated phenotype is masked in a heterozygote under complete dominance.'),('Complete dominance','Inheritance pattern in which one allele determines the heterozygote phenotype.'),('Incomplete dominance','Inheritance pattern in which a heterozygote has an intermediate phenotype.'),('Locus','Position of a gene or DNA sequence on a chromosome.'),('Fertilization','Fusion of gametes that combines genetic material from two parents.'),('Mutation','Change in a DNA sequence that can create a new allele.'),('Allele frequency','Proportion of gene copies in a population that carry a particular allele.'),('Polygenic trait','Characteristic influenced by alleles at multiple genes.'),('Environmental influence','Effect of conditions such as nutrition on how a trait develops.'),('Homozygous','Having two copies of the same allele at a gene location.')],
 'science--life-science-biology--evolution-and-natural-selection':[
  ('Mutation','Change in DNA that can introduce heritable variation.'),('Fitness','Relative contribution of an organism’s offspring to later generations.'),('Heritable variation','Inherited differences among individuals in a population.'),('Common ancestry','Shared ancestry inferred from similarities among organisms.'),('Homologous structure','Feature with a similar underlying organization inherited from a common ancestor.'),('Speciation','Evolutionary process in which populations become distinct species.'),('Reproductive isolation','Barriers that limit gene exchange between populations.'),('Allele frequency','Proportion of a population’s gene copies represented by an allele.'),('Population','Members of one species living in the same area at the same time.'),('Antibiotic resistance','Inherited ability of some bacteria to survive exposure to an antibiotic.'),('Selective pressure','Environmental factor that affects reproductive success.'),('Fossil record','Collection of preserved remains and traces documenting past life.')],
 'science--life-science-biology--classification-and-taxonomy':[
  ('Binomial nomenclature','System that gives each species a two-part scientific name.'),('Scientific name','Standardized name used to identify a species.'),('Specific epithet','Second part of a species’ binomial name.'),('Domain','Broadest rank among the three levels in the common classification system.'),('Bacteria','One of two domains containing prokaryotic organisms.'),('Archaea','Domain of prokaryotes distinct from bacteria.'),('Phylogeny','Evolutionary history and relationships of organisms.'),('Common ancestor','Ancestral population shared by two or more groups.'),('Cladogram','Diagram showing proposed branching relationships among groups.'),('Branch point','Location on a phylogenetic diagram representing a common ancestor.'),('Derived trait','Feature that evolved in a lineage and can help identify its descendants.'),('Convergent evolution','Independent evolution of similar features in unrelated lineages.'),('Classification','Organization of organisms into groups based on shared evidence.'),('Identification key','Tool that identifies organisms through a series of paired choices.'),('Species','Group of organisms defined by a classification system; many can interbreed and produce fertile offspring.')],
 'science--physics--waves-and-sound':[
  ('Mechanical wave','Wave that requires a material medium to travel.'),('Longitudinal wave','Wave whose oscillations are parallel to its direction of travel.'),('Sound wave','Mechanical pressure disturbance that travels through a material medium.'),('Pitch','Perception associated mainly with sound frequency.'),('Loudness','Perception associated with sound intensity and hearing conditions.'),('Doppler effect','Observed frequency shift caused by relative motion of a source and observer.'),('Wave speed','Distance a wave disturbance travels per unit time.'),('Medium','Material through which a mechanical wave travels.'),('Crest','Highest point of a transverse wave relative to equilibrium.'),('Trough','Lowest point of a transverse wave relative to equilibrium.'),('Compression','Region of a longitudinal wave where particles are close together.'),('Rarefaction','Region of a longitudinal wave where particles are farther apart.')],
 'science--physics--electric-circuits':[
  ('Resistor','Circuit component designed to provide electrical resistance.'),('Battery','Source that maintains a potential difference using chemical reactions.'),('Conducting wire','Material path that allows charge to flow through a circuit.'),('Switch','Component that opens or closes a circuit path.'),('Ammeter','Instrument connected in series to measure current.'),('Voltmeter','Instrument connected in parallel to measure potential difference.'),('Fuse','Protective device that opens a circuit when current is too high.'),('Ohm law','Relationship among voltage, current, and resistance for an ohmic component.'),('Electric circuit','Connected path through which electric charge can flow.'),('Overload','Condition in which current exceeds a circuit or cord rating.')],
 'science--physics--light-and-optics':[
  ('Electromagnetic wave','Wave of changing electric and magnetic fields that can travel through empty space.'),('Law of reflection','Rule that the incident and reflected angles are equal when measured from the normal.'),('Focal point','Point where parallel rays converge after passing through a converging lens.'),('Real image','Image formed where light rays actually meet.'),('Virtual image','Image at a location from which light rays appear to originate.'),('Normal line','Line perpendicular to a surface at the point where a ray strikes.'),('Visible spectrum','Range of electromagnetic wavelengths detectable by human vision.'),('Prism','Transparent optical object that can separate light by wavelength-dependent refraction.'),('Diffuse reflection','Reflection in many directions from a rough surface.'),('Opaque object','Object that blocks light from passing through it.'),('Shadow','Region where light is blocked by an object.'),('Image distance','Distance from an optical element to the image it forms.'),('Converging lens','Lens that brings parallel incoming rays together in the usual ray model.'),('Wavelength','Distance between corresponding points on adjacent wave cycles.')],
 'science--physics--magnetism-and-electromagnetism':[
  ('Magnetic pole','Region near an end of a magnet where its magnetic effect is strongest.'),('Magnetic field','Region where magnetic forces can act on magnets or moving charges.'),('Magnetic flux','Measure of magnetic field passing through a specified area.'),('Compass','Instrument whose magnetic needle aligns with a local magnetic field.'),('Magnetic domain','Region in a material where many atomic magnetic moments align.'),('Induced current','Current produced when magnetic flux through a conducting loop changes.')],
 'science--physics--static-electricity':[
  ('Positive charge','Net electric charge resulting when an object has fewer electrons than protons.'),('Negative charge','Net electric charge resulting when an object has more electrons than protons.'),('Polarization','Redistribution of charge within an object without necessarily changing its net charge.'),('Grounding','Connection that lets charge move between an object and Earth.'),('Insulator','Material in which electric charge does not move freely through the bulk.'),('Electrostatic force','Attractive or repulsive force between electric charges.'),('Coulomb law','Relationship describing electric force as dependent on charge and separation.')],
 'science--physics--electric-power-and-safety':[
  ('Kilowatt-hour','Unit of energy equal to one kilowatt used for one hour.'),('Ground-fault interrupter','Safety device that detects an imbalance between outgoing and returning current.'),('Circuit breaker','Protective switch that opens a circuit when current exceeds a safe level.'),('Electrical overload','Condition in which connected devices demand more current than a circuit rating.'),('Electrical hazard','Condition that can cause electric shock, burns, or fire.'),('Protective grounding','Safety connection that provides a low-resistance path for fault current.'),('Energy consumption','Amount of electrical energy used over a period of operation.'),('Fuse','Protective device that melts and opens a circuit when current is excessive.')],
 'science--physics--wave-interference-and-resonance':[
  ('Resonance','Large response when a periodic driving frequency is near a system’s natural frequency.'),('Antinode','Point of maximum displacement in a standing wave.'),('Standing wave','Pattern formed by overlapping waves traveling in opposite directions.'),('Natural frequency','Frequency at which a system tends to oscillate when disturbed.'),('Beat frequency','Rate of loudness variation produced by two nearby sound frequencies.'),('Phase','Position within a repeating wave cycle.'),('Pulse','Single, localized disturbance that travels through a medium.'),('Wave speed','Distance traveled by a wave per unit time.'),('Harmonic','Frequency that is an integer multiple of a system’s fundamental frequency.'),('Cancellation','Reduction in displacement when waves overlap with opposite phases.'),('Reinforcement','Increase in displacement when overlapping waves have the same phase.'),('Oscillation','Repeated motion or change around an equilibrium state.')],
 'science--inquiry-environment--environmental-pollution':[
  ('Pollution prevention','Actions that reduce or eliminate pollutants before they enter the environment.'),('Persistent pollutant','Contaminant that breaks down slowly and can remain in the environment.'),('Sediment runoff','Soil particles carried from land into surface water by flowing water.')],
 'science--inquiry-environment--water-quality':[
  ('pH','Scale from 0 to 14 used to express the acidity or basicity of an aqueous solution.'),('Nitrate','Dissolved nutrient that can contribute to excessive aquatic plant growth.'),('Phosphate','Dissolved nutrient that can contribute to eutrophication.'),('Water contaminant','Substance or organism in water that may affect its quality or uses.'),('Microbial indicator','Organism measured to assess possible pathogen contamination.'),('Water sampling','Collection of water in a way designed to represent a place and time.'),('Water standard','Defined criterion used to assess water for a particular use.')],
 'science--inquiry-environment--air-quality':[
  ('Ground-level ozone','Secondary pollutant formed when nitrogen oxides and volatile organic compounds react in sunlight.'),('Nitrogen oxides','Group of gases that can contribute to smog and ozone formation.'),('Volatile organic compound','Carbon-containing compound that readily enters the air as a gas.'),('Ozone precursor','Pollutant that participates in reactions forming ground-level ozone.'),('Smog','Air pollution mixture that can include ozone and fine particles.'),('Fine particles','Small airborne particles that can be inhaled deeply into the lungs.'),('Air inversion','Atmospheric condition in which warmer air overlies cooler surface air.'),('Ventilation','Exchange of indoor air with outdoor air.'),('Combustion emission','Pollutant released when a fuel burns.'),('Air monitoring','Measurement of pollutant concentrations at a location over time.'),('Emission control','Method for reducing pollutant release from a source.')],
 'science--earth-space-science--stars-and-stellar-life-cycles':[
  ('Main sequence','Long-lived stellar stage when a star fuses hydrogen in its core.'),('Hydrogen fusion','Nuclear process that combines hydrogen nuclei to form helium and release energy.'),('Stellar mass','Amount of matter in a star, a major factor in its evolution.'),('Red giant','Expanded late stage of a lower- or intermediate-mass star.'),('Planetary nebula','Expelled gas surrounding the remnant of a lower-mass star.'),('Neutron star','Extremely dense remnant that can form after a massive stellar core collapses.'),('Black hole','Region where gravity is so strong that light cannot escape from within its event horizon.'),('Stellar remnant','Compact object left after a star sheds or collapses its outer layers.'),('Gravitational collapse','Contraction of matter under its own gravitational attraction.'),('Nuclear fuel','Material in a star that can release energy through nuclear reactions.'),('Red supergiant','Very large, cool late stage of a massive star.'),('Star cluster','Group of stars held near one another by gravity.'),('Core collapse','Rapid inward contraction of a massive star’s core.')],
 'science--earth-space-science--galaxies-and-the-universe':[
  ('Light-year','Distance light travels in one year.'),('Big Bang model','Model describing the universe’s evolution from an early hot, dense state.'),('Dark energy','Name for the component associated with the observed accelerated expansion of the universe.'),('Cosmic expansion','Increase in large-scale distances between unbound regions of the universe.'),('Redshift','Shift of spectral features toward longer wavelengths.'),('Constellation','Recognized pattern of stars on the sky; its stars need not be near each other.'),('Gravitational lensing','Bending of light by gravity that can reveal mass along its path.'),('Galaxy rotation curve','Graph of orbital speed versus distance from a galaxy’s center.'),('Observable universe','Region of the universe from which light has had time to reach an observer.'),('Spectral line','Wavelength-specific feature used to study an object’s composition and motion.'),('Expansion of space','Increase in distances among far-separated regions of the universe.')],
 'science--earth-space-science--space-observation-and-exploration':[
  ('Telescope','Instrument that collects electromagnetic radiation from distant objects.'),('Collecting area','Area that gathers incoming light for an optical telescope.'),('Spectroscope','Instrument that separates light into its component wavelengths.'),('Spectral line','Feature at a particular wavelength that can reveal an element or motion.'),('Rover','Robotic vehicle designed to move across a planetary surface.'),('Radio telescope','Instrument that detects radio waves from astronomical objects.'),('Infrared radiation','Electromagnetic radiation with wavelengths longer than visible light.'),('Atmospheric absorption','Removal of some wavelengths of radiation as they pass through an atmosphere.'),('Calibration','Comparison with known inputs to interpret an instrument’s readings.'),('Space communication delay','Time required for a signal to travel between Earth and a spacecraft.'),('Detector artifact','Instrument-produced feature that can be mistaken for a real observation.'),('Repeated observation','Additional measurement used to test whether a result is consistent.'),('Spacecraft','Vehicle designed to travel or operate in space.'),('Orbiter','Spacecraft that travels around a planet or other celestial body.'),('Mission control','Team and facility that plan and monitor spacecraft operations.'),('Wavelength band','Range of electromagnetic wavelengths measured by an instrument.')],
}
MANUAL_TOPIC_TERMS['science--life-science-biology--classification-and-taxonomy'] += [('Clade','An ancestor and all of its descendants in a phylogenetic classification.'),('Order','Taxonomic rank between class and family.')]
MANUAL_TOPIC_TERMS['science--physics--electric-circuits'] += [('Circuit branch','One of multiple paths through a parallel circuit.'),('Electric charge','Physical property that causes electric interactions.'),('Electrical energy','Energy transferred by electric charges in a circuit.')]
MANUAL_TOPIC_TERMS['science--physics--magnetism-and-electromagnetism'] += [('Magnetization','Alignment of magnetic domains that gives a material a net magnetic effect.'),('Magnetic polarity','Designation of a magnet’s north-seeking and south-seeking ends.'),('Magnetic interaction','Attraction or repulsion between magnets or magnetic materials.'),('Coil','Wire wound into loops to strengthen the magnetic field produced by current.'),('Changing magnetic flux','Variation in magnetic field through a loop that can induce voltage.'),('Field strength','Measure of the intensity of a magnetic field.'),('Induction','Production of voltage when magnetic flux through a circuit changes.')]
MANUAL_TOPIC_TERMS['science--physics--magnetism-and-electromagnetism'] += [('Magnetic attraction','Force that pulls unlike magnetic poles toward one another.'),('Magnetic repulsion','Force that pushes like magnetic poles apart.'),('Electromagnetic induction','Production of voltage when magnetic flux through a circuit changes.')]
MANUAL_TOPIC_TERMS['science--physics--static-electricity'] += [('Charge conservation','Principle that total electric charge in an isolated system remains constant.'),('Electric potential','Stored energy per unit charge at a location in an electric field.'),('Electric potential difference','Change in stored energy per unit charge between two locations.'),('Conductor','Material in which electric charges can move relatively freely.'),('Electric field','Region in which a charged object experiences electric force.'),('Contact charging','Transfer of electric charge through direct contact.'),('Charging by induction','Charge redistribution caused by a nearby charged object without direct contact.'),('Electron','Negatively charged subatomic particle.'),('Atomic nucleus','Central part of an atom containing protons and neutrons.')]
MANUAL_TOPIC_TERMS['science--physics--electric-power-and-safety'] += [('Electric energy use','Amount of electrical energy consumed during operation.'),('Ground fault','Unintended electrical connection between a circuit and ground.'),('Overload protection','Fuse or breaker action that interrupts excessive current.'),('Electrical grounding','Connection to Earth designed to reduce shock risk.'),('Energy transfer rate','Amount of energy transferred per unit time.'),('Current rating','Maximum current a wire or device is designed to carry.'),('Electrical fire','Fire that can result from overheating, arcing, or faulty wiring.')]
MANUAL_TOPIC_TERMS['science--physics--light-and-optics'] += [('Angle of incidence','Angle between an incoming ray and the normal to a surface.'),('Optical axis','Reference line through the center of a lens or mirror.')]
MANUAL_TOPIC_TERMS['science--earth-space-science--stars-and-stellar-life-cycles'] += [('Hydrostatic equilibrium','Balance between inward gravity and outward pressure in a stable star.'),('Stellar evolution','Changes in a star’s structure and energy production over its lifetime.'),('Stellar nucleosynthesis','Formation of atomic nuclei within stars through nuclear reactions.')]
MANUAL_TOPIC_TERMS['science--earth-space-science--galaxies-and-the-universe'] += [('Hubble law','Observed relationship between galaxy distance and recession speed on large scales.')]

def write():
    banks=load_banks();assert len(banks)==101
    OUT.mkdir(parents=True,exist_ok=True);files={};stats=[];entries_by_id={};source_by_id={}
    for tid,b in banks.items():
        source=' '.join(q['question']+' '+q['answer']+' '+q['explanation'] for q in b['questions'])
        source_by_id[tid]=source
        if tid=='scientific-method':entries_by_id[tid]=manual_scientific_method();continue
        entries=[];seen=set()
        for q in b['questions']:
            srcans=clean(q['answer']);direct=answer_term(srcans)
            raw=clean(srcans).lower()
            qterm=question_term(q['question'])
            fix=TERM_FIXES.get(raw) or (TERM_FIXES.get(qterm.lower()) if qterm else None) or (TERM_FIXES.get(direct.lower()) if direct else None)
            term=(fix[0] if fix else direct or qterm or answer_concept(srcans))
            clue=(fix[1] if fix else question_clue(q['question']) if direct else definition_clue(q['explanation'] or srcans,term or ''))
            if not term or not viable(term) or BAD_ANSWER.match(term) or norm(term) in seen:continue
            term=display_term(term);clue=clean(clue)
            if norm(term) in norm(clue):clue=question_clue(q['question'])
            if not clue_is_usable(term,clue):
                glossary_fix=TERM_FIXES.get(term.lower())
                clue=glossary_fix[1] if glossary_fix else definition_clue(q['explanation'] or '',term)
            if not clue_is_usable(term,clue):continue
            entries.append((term,clue));seen.add(norm(term))
        entries_by_id[tid]=entries

    # A few banks rely heavily on explanatory answer sentences that cannot be
    # safely shortened into entries. These additions are directly aligned to
    # the vocabulary used in those banks.
    for tid,terms in MANUAL_TOPIC_TERMS.items():
        entries=entries_by_id[tid];seen={norm(a) for a,_ in entries}
        for term,clue in terms:
            if len(entries)>=20:break
            if norm(term) in seen:continue
            entries.append((term,clue));seen.add(norm(term))

    # Fill each progression only with vocabulary drawn from a closely related
    # Science unit. Prefer terms explicitly named in the target bank; otherwise
    # use a neighboring unit's concise definition from the same curricular group.
    glossary={norm(term):(term,clue) for term,clue in TERM_FIXES.values()}
    for tid,b in banks.items():
        entries=entries_by_id[tid];seen={norm(a) for a,_ in entries};source=re.sub(r'[^A-Z]+',' ',source_by_id[tid].upper())
        group=topic_group(tid);exact=[];nearby=[]
        candidates_seen=set(seen)
        for pid,pb in banks.items():
            if pid==tid:continue
            if topic_group(pid)!=group:continue
            if not peer_eligible(tid,pid):continue
            for term,clue in entries_by_id[pid]:
                key=norm(term)
                if key in candidates_seen or len(key)<3:continue
                if not viable(term):continue
                is_exact=bool(re.search(r'(?<![A-Z])'+re.escape(key)+r'(?![A-Z])',source))
                if not peer_term_eligible(tid,pid,term,is_exact):continue
                if not is_exact and not clue_is_usable(term,clue):continue
                # Prefer an authored, general definition for a recognized term.
                term,clue=glossary.get(key,(term,clue))
                if not clue_is_usable(term,clue):continue
                pair=(term,clue,pid)
                candidates_seen.add(key)
                (exact if is_exact else nearby).append(pair)
        for term,clue,pid in exact+nearby:
            if len(entries)>=20:break
            if norm(term) in seen:continue
            entries.append((term,clue));seen.add(norm(term))
        if len(entries)!=20:stats.append({'id':tid,'terms':len(entries),'title':b['topic']['title'],'selected':[a for a,_ in entries]})
        else:
            lines=['['+tid+']']+[f'{a}|{c}' for a,c in entries]
            owncat=b['topic'].get('category','Science Foundations')
            files.setdefault(owncat.lower().replace(' & ','-').replace(' ','-'),[]).extend(lines+[''])
    for old in OUT.glob('*.txt'):old.unlink()
    for slug,lines in files.items():(OUT/(slug+'.txt')).write_text('\n'.join(lines).rstrip()+'\n')
    print(json.dumps({'topicCount':len(banks),'authored':len(banks)-len(stats),'exceptions':stats,'categoryFiles':list(files)},indent=2))

if __name__=='__main__':write()

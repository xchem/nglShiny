
HTMLWidgets.widget({

  name: 'nglShiny',
  type: 'output',

  factory: function(el, width, height) {
    console.log("manufacturing nglShiny widget");
    return {
       renderValue: function(options) {
          console.log("---- options");
          console.log(options)
          var stage;
          stage = new NGL.Stage(el);

          stage.signals.clicked.removeAll();
          stage.signals.clicked.add(function (pickingProxy) {
            const clicked = window.clicked;
            const clickNames = window.clickNames;
            if (pickingProxy.altKey===true && (pickingProxy.atom || pickingProxy.bond )){
              const atom = pickingProxy.atom || pickingProxy.closestBondAtom;

              const fullname = atom.qualifiedName();
              const name = atom.index;

              // Check if clicked atom is in array
              if (clicked.includes(name)) {
                for(var i = 0; i < clicked.length; i++){
                  if (clicked[i] === name){clicked.splice(i,1); }
                }
              } else {
                clicked.push(name);
              }
              // Possible to put into the above loop, but this all needs fixing up anyway.
              // Although poor coding, and twice as computationally expensive, it's easier to understand at the moment.

              if (clickNames.includes(fullname)) {
                for(var i = 0; i < clickNames.length; i++){
                  if (clickNames[i] === fullname) {clickNames.splice(i,1)}
                }
              } else {
                clickNames.push(fullname);
              }


              console.log(clickNames);
              console.log(clicked);

              // behaviour:
              // Clear existing representations
              if (window.clickedRepresentation !== undefined) pickingProxy.component.removeRepresentation(window.clickedRepresentation);

              // Remake representation
              var seleName = []
              for (var i = 0; i < clicked.length; i++){
                seleName[i] = clicked[i]
              }
              window.clickedRepresentation = pickingProxy.component.addRepresentation("ball+stick", { sele: '@'.concat(seleName.toString()) , aspectRatio: 6, opacity: 0.5});

              // Output to back-end
              Shiny.onInputChange('clickedAtoms', clicked);
              Shiny.onInputChange('clickNames', clickNames);
            }
            window.clicked = clicked;
          });
          window.stage = stage;
          //uri = "rcsb://" + options.pdbID;
          uri = options.pdbID;
          window.pdbID = options.pdbID;
          stage.loadFile(uri, {defaultRepresentation: false}).then(function(o){
          o.autoView(500)
              }) // then
          },
       resize: function(width, height) {
          console.log("entering resize");
          correctedHeight = window.innerHeight * 0.7;
          $("#nglShiny").height(correctedHeight);
          console.log("nglShiny.resize: " + width + ", " + correctedHeight + ": " + height);
          stage.handleResize()
          }
    } // return
  } // factory
});  // widget

//------------------------------------------------------------------------------------------------------------------------
function setComponentNames(x, namedComponents)
{
   console.log("--- setComponentNames");
   console.log(namedComponents);

    // stage.getComponentsByName(window.pdbID).list[0].removeAllRepresentations()

   for(name in namedComponents){
     attributes = namedComponents[name];
     var rep = attributes.representation;
     var selectionString = attributes.selection;
     console.log("name '" + name + "' for '" + selectionString + "' rep: " + rep)
     debugger;
     //stage.getComponentsByName(window.pdbID).addRepresentation(rep, {sele: selectionString,
     //                                  name: name})
     } // for name

   //component.addRepresentation('ball+stick', {name: 'ligand', sele: 'ligand'})
   //stage.getComponentsByName(window.pdbID).addRepresentation(rep, attributes);

} // setComponentNames

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addFileHandler", function(message){
  // Pretty much every other function in this file can be done using this multiple times.
  /* Some Fields that do things before representationParameters
    message.clearStage
    message.object_name
    message.window_object
    message.clearWindow
    message.filestring
    message.extension
    message.representation
    message.autoView
    message.isBinary
  */
  if(message.clearStage){ // Blank SlatEe?
    stage.removeAllComponents()
  }
  if(message.window_object){ // Initialise the window object if missing
    if(!window[message.window_object]){
      window[message.window_object] = {}
    }
    if(message.clearWindow){ // Reset the object and dispose of current components if present, if asked for.
      if (Object.entries(window[message.window_object]).length > 0){
        Object.entries(window[message.window_object]).map(y => { x[1].dispose(); delete window[message.window_object][x[0]] })
      }
      window[message.window_object] = {}
    }
  }
  if(message.isBinary){ // Read data, if binary convert b64 string to bytes array then, blob. otherwise blob
    var byteCharacters = atob(message.filestring);
    var byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++){
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    };
    var byteArray = new Uint8Array(byteNumbers);
    var blob = new Blob([byteArray], {type: 'application/octet-binary'});
  } else {
    var blob = new Blob([message.filestring], {type: 'text/plain'});
  }
  stage.loadFile(blob, { ext: message.extension }).then(function(comp){ // Render component using specific representation and remaining options in message.
    window[message.window_object][message.object_name] = comp.addRepresentation(message.representation, message)
    if(message.autoView){comp.autoView(3000)}
  })
})




//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fit", function(message){
    console.log("nglShiny fit");
    stage.autoView(500);
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("ligfit", function(message){
    var stringBlob = new Blob( [ window.pdbID ], { type: 'text/plain'} );
    stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp) {
      comp.autoView("LIG");
    });
})

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("removeAllRepresentations", function(message){

    stage.getComponentsByName(window.pdbID).list[0].removeAllRepresentations()
    stage.getComponentsByName(window.pdbID).list[1].removeAllRepresentations()
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("removeAllComponents", function(message){
    stage.removeAllComponents()
})

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setRepresentation", function(message){

    console.log("nglShiny setRepresentation")
    var rep = message;
    window.representation = rep;
    stage.getComponentsByName(window.pdbID).addRepresentation(rep)
})

//--------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("updateParams", function(message){
  console.log("nglShiny updateParams");
  var clipDist = message[0];
  var clipNear = message[1];
  var clipFar  = message[2];
  var fogNear  = message[3];
  var fogFar   = message[4];
  stage.setParameters({
    'clipDist': clipDist,
    'clipNear': clipNear,
    'clipFar': clipFar,
    'fogNear': fogNear,
    'fogFar': fogFar,
  });
})

//-------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("updateaparam", function(message){
  let obj = {}
  obj[message[0]] = message[1];
  stage.setParameters(obj);
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("as_resetclicked", function(message){
  window.clicked = [];
  window.clickNames = [];
  // No idea if this messes things up...
  Shiny.onInputChange('clickedAtoms', window.clicked);
  Shiny.onInputChange('clickNames', window.clickNames);
  window.clickedRepresentation.setVisibility(false) // Just flick it off...
})

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setColorScheme", function(message){

    console.log("nglShiny setColorScheme")
    var newScheme = message[0];
    window.colorScheme = newScheme;
    console.log("new scheme: " + newScheme);
    // debugger;
    stage.getComponentsByName(window.pdbID).addRepresentation(window.representation, {colorScheme: newScheme})
})

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setPDB", function(message){
    stage.removeAllComponents()
    window.pdbID = message[0];
    console.log("nglShiny setPDB: " + window.pdbID)
    //var url = "rcsb://" + window.pdbID;
    var url = window.pdbID;
    stage.loadFile(url).then(function(comp){
      comp.addRepresentation("ball+stick", {colorScheme: "residueIndex"});
      })
       // redundant?
    stage.getComponentsByName(window.pdbID).addRepresentation(window.representation, {colorScheme: window.colorScheme})
    stage.autoView(3000)
    })


if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('setup', function(message){
  stage.setParameters({
    cameraType: "orthographic"//, mousePreset: "coot"
  })
  window.clicked = [];
  window.clickNames = [];
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setPDB2", function(message){
    stage.removeAllComponents();
    // Assumption, message is R list of n objects
    var pdb = message[0];
    window.pdbID = pdb;
    var stringBlob = new Blob( [ pdb ], { type: 'text/plain'} );
    console.log("Uploading PDB")
    stage.setParameters({'clipNear':parseFloat(message[2]), 'clipFar':parseFloat(message[3]), 'clipDist':parseFloat(message[1]), 'fogNear':parseFloat(message[4]), 'fogFar':parseFloat(message[5])});
    stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp) {
      window.struc = comp.addRepresentation("ball+stick");
      window.ligand = comp.addRepresentation("ball+stick", {sele: "LIG", colorValue: "limegreen", multipleBond: "symmetric"});
      comp.addRepresentation("contact", {sele: "not (water or ion)"});
      comp.autoView("LIG");
    });
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setapoPDB", function(message){
    stage.removeAllComponents();
    // Assumption, message is R list of n objects
    var pdb = message[0];
    window.pdbID = pdb;
    var stringBlob = new Blob( [ pdb ], { type: 'text/plain'} );
    console.log("Uploading PDB")
    stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp) {
      window.struc = comp.addRepresentation(message[1], {'linewidth':6});
      if (message[2] === 'true') {
        comp.autoView(3000)
      }
    });
    if (message[2] === 'true') {
      stage.autoView(3000)
    }
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('messageDump', function(message){
  console.log(message)
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addContacts", function(message){
  var pdb = message[0];
  window.contactID = pdb
  var stringBlob = new Blob( [ pdb ], { type: 'text/plain'} );
  stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp) {
    window.contacts = comp.addRepresentation('contact')
  })
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addMol", function(message){
    var mol = message[0];
    var stringBlob = new Blob( [ mol ], { type: 'text/plain'} );
    console.log("Uploading .Mol")
    console.log('New Message!!')
    console.log(mol)
    stage.loadFile(stringBlob, { ext: "mol" }).then(function (comp) {
      comp.addRepresentation("licorice", {multipleBond: "symmetric", opacity:.25});
      //comp.autoView();
    });
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addMolandfocus", function(message){
    //try {
    //  window.mol.setVisibility(false)
    //}
    //finally {
    var mol = message[0];
    window.molstring = mol
    var stringBlob = new Blob( [ mol ], { type: 'text/plain'} );
    console.log("Uploading .Mol")
    stage.loadFile(stringBlob, { ext: message[1] }).then(function (comp) {
      window.mol = comp.addRepresentation("licorice", {colorValue: 'limegreen', multipleBond: "symmetric"});
      if (message[2] === 'true') {
        comp.autoView(3000)
      }
    });
  //}
});

if (HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('save_camera_pos', function (message)
{
  window.om = stage.viewerControls.getOrientation()
});

if (HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('restore_camera_pos', function (message)
{
  stage.animationControls.orient(window.om, 3000);
});

if (HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('focus_on_mol', function (message)
{
  var stringBlob = new Blob([window.molstring], { type: 'text/plain' });
  stage.loadFile(stringBlob, { ext: 'mol' }).then(function (comp)
  {
    comp.addRepresentation('ball+stick', { aspectRatio: 0, radius: 0 })
    comp.autoView(3000)
  })
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fv_addMolandfocus", function(message){
    try {
      window.mol.setVisibility(false)
    }
    finally {
    var mol = message[0];
    var stringBlob = new Blob( [ mol ], { type: 'text/plain'} );
    console.log("Uploading .Mol")
    stage.loadFile(stringBlob, { ext: "mol"}).then(function (comp) {
      window.mol = comp.addRepresentation("licorice", {colorValue: 'limegreen', multipleBond: "symmetric"});
      //comp.autoView();
    });
  }
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("clear_window_field", function(message){
    if(!window[message[0]]){
      window[message[0]]=[]
    } else {
      window[message[0]].map(x => x.setVisibility(false))
      window[message[0]] = []
    }
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('setVisibility', function(message){
  if(window[message[0]]){
    window[message[0]].setVisibility()
  }
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('setBFactor', function(message){
  if(!window['bfactors']) window['bfactors'] = []
  var pdb = message[0];
  var stringBlob = new Blob( [ pdb ], { type: 'text/plain'} );
  stage.loadFile(stringBlob, { ext: "pdb"}).then(function (comp) {
      console.log('Rendering Bfactor')
      window['bfactors'].push(comp.addRepresentation("line", {color: 'bfactor', linewidth:6}));
  });
})

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fv_addMolandfocus_withcolor", function(message){
    if(!window.othermol) window.othermol=[]
    var mol = message[0];
    var stringBlob = new Blob( [ mol ], { type: 'text/plain'} );
    stage.loadFile(stringBlob, { ext: "mol"}).then(function (comp) {
      window.othermol.push(comp.addRepresentation("licorice", {colorValue: message[1], multipleBond: "symmetric"}));
    });
})

if (HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('go_to_residue', function (message)
{
  var gotores = window.pdbID
  var stringBlob = new Blob( [ gotores ], { type: 'text/plain'} );
  console.log("Go To:")
  console.log(message[0])
  stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp)
  { 
    comp.addRepresentation('ball+stick', {aspectRatio:0, radius:0, sele: message[0]})
    comp.autoView(message[0], 3000)
  })
})

if (HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('highlight_residues', function (message)
{
  try {
    window.highlight.dispose()
  }
  finally {
    var viewedstruc = window.pdbID
    var stringBlob = new Blob([viewedstruc], { type: 'text/plain' });
    stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp)
    { 
      window.highlight = comp.addRepresentation('ball+stick', {color:'magenta', sele: message[0]})
    })
  }
})


//--------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('addVolumeDensity', function(message){
  if(!window['eventmap']) window['eventmap'] = []
  if(!window['twofofc']) window['twofofc'] = []
  if(!window['fofcpos']) window['fofcpos'] = []
  if(!window['fofcneg']) window['fofcneg'] = []
  try {
    console.log('Clearing')
    window[message[7]].dispose()
    console.log('Cleared!')
  } 
  finally {
    var byteCharacters = atob(message[0]);
    var byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++){
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    };
    var byteArray = new Uint8Array(byteNumbers);
    var blob = new Blob([byteArray], {type: 'application/octet-binary'});
    stage.loadFile( blob, { ext: message[4] } ).then(function (comp) {
      window[message[7]] = comp.addRepresentation('surface', {
        isolevelType: message[8],
        background: true,
        isolevel: parseFloat(message[1]),
        color: message[2],
        negateIsolevel: message[3] === 'true',
        boxSize: parseFloat(message[5]),
        smooth: 10,
        useWorker: true,
        contour: true,
        wrap: false
      }).setVisibility(message[6] === 'true');
    });
  }
});


if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('updateVolumeDensityISO', function(message){
  window[message[0]].setParameters({
    isolevel: parseFloat(message[1])
  });
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler('updateVolumeDensityBoxSize', function(message){
  window[message[0]].setParameters({
    boxSize: parseFloat(message[1])
  });
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("updateVolumeDensityVisability", function(message){
  window[message[0]].setVisibility((message[1]=='true'))
});


if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("updateAssembly", function(message){
  console.log("Update Assembly to" + message[0])
  window.struc.setParameters({assembly:message[0]});
  window.ligand.setParameters({colorValue: "limegreen"})
})



//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("select", function(message){

    residueString = message[0];
    console.log("nglShiny select: " + residueString)
    stage.getComponentsByName(window.pdbID).addRepresentation("ball+stick", {sele: residueString})
    //stage.getComponentsByName(window.pdbID).addRepresentation("ball+stick", {sele: "23, 24, 25, 26, 27, 28, 29, 30"})
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("showSelection", function(message){

    //residueString = message[0];
    var rep = message.representation;
    var selection = message.selection;
    var colorScheme = message.colorScheme;
    var name = message.name;
    var attributes = {sele: selection, colorScheme: colorScheme, name: name};
    console.log("attributes")
    console.log(attributes)
    console.log("nglShiny showSelection: " + rep + ",  " + selection);
    //stage.getComponentsByName(window.pdbID).addRepresentation(rep, {sele: selection, colorScheme: colorScheme, name: name})
    stage.getComponentsByName(window.pdbID).addRepresentation(rep, attributes);
    // stage.getComponentsByName('1ztu').addRepresentation('ball+stick', {sele: 'not helix and not sheet and not turn and not water'})
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setVisibility", function(message){

    var repName = message.representationName;
    var newState = message.newState;
    console.log("set visibility " + repName + "  " + newState)
    stage.getRepresentationsByName(repName).setVisibility(newState)
    })

//------------------------------------------------------------------------------------------------------------------------

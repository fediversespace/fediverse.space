package space.fediverse.graph;

import org.gephi.graph.api.GraphController;
import org.gephi.graph.api.GraphModel;
import org.gephi.io.database.drivers.PostgreSQLDriver;
import org.gephi.io.exporter.api.ExportController;
import org.gephi.io.importer.api.Container;
import org.gephi.io.importer.api.EdgeDirectionDefault;
import org.gephi.io.importer.api.ImportController;
import org.gephi.io.importer.plugin.database.EdgeListDatabaseImpl;
import org.gephi.io.importer.plugin.database.ImporterEdgeList;
import org.gephi.io.processor.plugin.DefaultProcessor;
import org.gephi.layout.plugin.AutoLayout;
import org.gephi.layout.plugin.forceAtlas2.ForceAtlas2;
import org.gephi.project.api.ProjectController;
import org.gephi.project.api.Workspace;
import org.openide.util.Lookup;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

public class GraphBuilder {

    private static final String nodeQuery = String.join(""
            , "SELECT"
            , " scraper_instance.name AS id,"
            , " scraper_instance.name AS label,"
            , " scraper_instance.user_count"
            , " FROM scraper_instance WHERE status = 'success'"
    );

    private static final String edgeQuery = String.join(""
            , "SELECT"
            , " scraper_instance_peers.from_instance_id AS source,"
            , " scraper_instance_peers.to_instance_id AS target"
            , " FROM scraper_instance_peers"
    );


    public static void main(String[] args) {

        Path currentRelativePath = Paths.get(".");

        // Init project & workspace; required to do things w/ gephi
        ProjectController pc = Lookup.getDefault().lookup(ProjectController.class);
        pc.newProject();
        Workspace workspace = pc.getCurrentWorkspace();

        // Get controllers and models
        ImportController importController = Lookup.getDefault().lookup(ImportController.class);
        GraphModel graphModel = Lookup.getDefault().lookup(GraphController.class).getGraphModel();
        // AttributeModel?

        // Import from database

        EdgeListDatabaseImpl db = new EdgeListDatabaseImpl();
        db.setSQLDriver(new PostgreSQLDriver());
        db.setHost("localhost");
        db.setPort(5432);
        db.setDBName(args[0]);
        db.setUsername(args[1]);
        db.setPasswd(args[2]);
        db.setNodeQuery(nodeQuery);
        db.setEdgeQuery(edgeQuery);

        ImporterEdgeList edgeListImporter = new ImporterEdgeList();
        Container container = importController.importDatabase(db, edgeListImporter);
        // If a node is in the edge list, but not node list, we don't want to create it automatically
        container.getLoader().setAllowAutoNode(false);
        container.getLoader().setAllowSelfLoop(false);
        container.getLoader().setEdgeDefault(EdgeDirectionDefault.UNDIRECTED);  // This is an undirected graph

        // Add imported data to graph
        importController.process(container, new DefaultProcessor(), workspace);

        // Layout
        AutoLayout autoLayout = new AutoLayout(2, TimeUnit.MINUTES);
        autoLayout.setGraphModel(graphModel);
//        YifanHuLayout firstLayout = new YifanHuLayout(null, new StepDisplacement(1f));
        ForceAtlas2 secondLayout = new ForceAtlas2(null);
//        AutoLayout.DynamicProperty adjustBySizeProperty = AutoLayout.createDynamicProperty("forceAtlas.adjustSizes.name", Boolean.TRUE, 0.1f);
//        AutoLayout.DynamicProperty repulsionProperty = AutoLayout.createDynamicProperty("forceAtlas.repulsionStrength.name", 500., 0f);
//        autoLayout.addLayout(firstLayout, 0.5f);
//        autoLayout.addLayout(secondLayout, 0.5f, new AutoLayout.DynamicProperty[]{adjustBySizeProperty, repulsionProperty});
        autoLayout.addLayout(secondLayout, 1f);
        autoLayout.execute();

        // Export
        ExportController exportController = Lookup.getDefault().lookup(ExportController.class);
        try {
            exportController.exportFile(new File("fediverse.gexf"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        // Gephi doesn't seem to provide a good way to close the postgres connection, so we have to force close the
        // program. This'll leave a hanging connection for some period ¯\_(ツ)_/¯
        System.exit(0);
    }
}

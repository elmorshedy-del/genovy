from dataclasses import dataclass
from pathlib import Path

from pheval.runners.runner import PhEvalRunner

from pheval_genovy.config import parse_tool_config
from pheval_genovy.post_process import post_process_results
from pheval_genovy.run import run_genovy_api


@dataclass
class GenovyPhEvalRunner(PhEvalRunner):
    input_dir: Path
    testdata_dir: Path
    tmp_dir: Path
    output_dir: Path
    config_file: Path
    version: str

    def prepare(self):
        print("preparing genovy")

    def run(self):
        print("running genovy")
        config = parse_tool_config(self.input_dir_config.tool_specific_configuration_options)
        enabled_analyses = [
            analysis_name
            for analysis_name, enabled in (
                ("gene", self.input_dir_config.gene_analysis),
                ("disease", self.input_dir_config.disease_analysis),
                ("variant", self.input_dir_config.variant_analysis),
            )
            if enabled
        ]

        if "variant" in enabled_analyses:
            raise ValueError("Genovy plugin does not yet support variant analysis.")
        if len(enabled_analyses) != 1:
            raise ValueError("Genovy plugin expects exactly one enabled analysis type.")

        config.analysis_type = enabled_analyses[0]
        run_genovy_api(
            phenopacket_dir=self.testdata_dir.joinpath("phenopackets"),
            raw_results_dir=self.raw_results_dir,
            tool_input_commands_dir=self.tool_input_commands_dir,
            config=config,
        )

    def post_process(self):
        print("post processing genovy")
        config = parse_tool_config(self.input_dir_config.tool_specific_configuration_options)
        if self.input_dir_config.gene_analysis:
            config.analysis_type = "gene"
        elif self.input_dir_config.disease_analysis:
            config.analysis_type = "disease"
        post_process_results(
            raw_results_dir=self.raw_results_dir,
            output_dir=self.output_dir,
            phenopacket_dir=self.testdata_dir.joinpath("phenopackets"),
            config=config,
        )
